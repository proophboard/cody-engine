import {DependencyRegistry} from "@event-engine/descriptions/descriptions";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {Message} from "@event-engine/messaging/message";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {getConfiguredPlayAuthService} from "@cody-play/infrastructure/auth/configured-auth-service";
import {PlayQueryRegistry} from "@cody-play/state/types";
import {determineQueryPayload} from "@app/shared/utils/determine-query-payload";
import {QueryRuntimeInfo} from "@event-engine/messaging/query";
import {makeLocalApiQuery} from "@cody-play/queries/local-api-query";
import {User} from "@app/shared/types/core/user/user";
import {
  playInformationServiceFactory
} from "@cody-play/infrastructure/infromation-service/play-information-service-factory";
import {INFORMATION_SERVICE_NAME} from "@event-engine/infrastructure/information-service/information-service";
import {EventMatcher} from "@event-engine/infrastructure/EventStore";
import {Event} from "@event-engine/messaging/event";
import {getConfiguredPlayEventStore} from "@cody-play/infrastructure/multi-model-store/configured-event-store";
import {asyncIterableToArray} from "@app/shared/utils/async-iterable-to-array";
import {normalizeEventMetadataMatcher} from "@app/shared/utils/normalize-event-metadata-matcher";
import {mapMetadataFromEventStore} from "@event-engine/infrastructure/EventStore/map-metadata-from-event-store";
import {execMappingAsync} from "@app/shared/rule-engine/exec-mapping";

export type PlayMessageType = 'command' | 'event' | 'query';

export const services: {[serviceName: string]: (options?: any) => any} = {
  AuthService: getConfiguredPlayAuthService,
  CodyInformationService: playInformationServiceFactory,
}

const eventStore = getConfiguredPlayEventStore();

export const playLoadDependencies = async (message: Message, type: PlayMessageType, dependencies: DependencyRegistry, config: CodyPlayConfig): Promise<any> => {
  const loadedDependencies: Record<string, any> = {};

  for (const dependencyKey in dependencies) {
    let depOrDepArr = dependencies[dependencyKey];

    if(!Array.isArray(depOrDepArr)) {
      depOrDepArr = [depOrDepArr];
    }

    for(const dep of depOrDepArr) {
      const depName = dep.alias || dependencyKey;

      if(dep.if) {
        const ctx: any = {meta: message.meta, name: message.name};

        ctx[type] = message.payload;

        if(! await jexl.eval(dep.if, ctx)) {
          continue;
        }
      }

      const messageDep: Record<string, object> = {};
      messageDep[type] = message.payload;

      switch (dep.type) {
        case "query":
          let msgCopy = {...message};
          if(dep.options?.query) {
            const payload: Record<string, any> = {};

            for (const prop in dep.options.query) {
              payload[prop] = await jexl.eval(dep.options.query[prop], {...loadedDependencies, ...messageDep, meta: message.meta});
            }

            msgCopy = {...msgCopy, payload};
          }

          loadedDependencies[depName] = await loadQueryDependency(dependencyKey, msgCopy, dep.options, config.queries, config);
          break;
        case "service":
          loadedDependencies[depName] = loadServiceDependency(dependencyKey, message, dep.options);
          break;
        case "events":
          if(!dep.options?.match) {
            throw new Error(`Missing "match" option in events dependency: ${depName}`);
          }

          const {match} = dep.options;

          if(typeof match !== "object") {
            throw new Error(`Type mismatch for dependency "${depName}". Events dependency option "match" has to be a Record<string, any>`);
          }

          const compiledMatch: EventMatcher = {};
          for (const prop in match) {
            compiledMatch[prop] = await execMappingAsync(match[prop], {...loadedDependencies, ...messageDep, meta: message.meta});
          }

          loadedDependencies[depName] = await loadEventsDependency(depName, {...dep.options, match: compiledMatch});
          console.log(`[CodyPlay] Loaded events dependency "${depName}" with options: `, {...dep.options, match: compiledMatch}, "Result: ", loadedDependencies[depName]);
          break;
        default:
          throw new Error(`Unknown dependency type detected for "${message.name}". Supported dependency types are: "query", "service", and "events". But the configured type is "${dep.type}"`);
      }
    }
  }

  // Always add Information Service so that read model rules can access it
  if(type === "event") {
    loadedDependencies[INFORMATION_SERVICE_NAME] = loadServiceDependency(INFORMATION_SERVICE_NAME, message, {});
  }

  return loadedDependencies;
}

const loadQueryDependency = (queryName: string, message: Message, options: any, queries: PlayQueryRegistry, config: CodyPlayConfig): Promise<any> => {
  if(!queries[queryName]) {
    throw new Error(`Query with name "${queryName}" cannot be found, but is configured as a dependency for "${message.name}"`);
  }

  const queryRuntimeInfo = queries[queryName];
  const keyMapping = options?.mapping || {};
  const queryPayload = message.payload;

  const queryParams = determineQueryPayload(queryPayload, queryRuntimeInfo as unknown as QueryRuntimeInfo, keyMapping);

  return makeLocalApiQuery(config, message.meta.user as User)(queryName, queryParams);
}

const loadServiceDependency = (serviceName: string, message: Message, options?: any): any => {
  if(!services[serviceName]) {
    throw new Error(`Service factory for service with name "${serviceName}" not found in service registry. In Cody Play you can only use built-in services like the AuthService. The service is configured as dependency for "${message.name}".`);
  }

  const serviceFactory = services[serviceName];

  return serviceFactory(options);
}

const loadEventsDependency =  async (alias: string, options: {stream?: string, match: EventMatcher, limit?: number, latestFirst?: boolean}): Promise<Event[]> => {
  if(!options.match || typeof options.match !== "object") {
    throw new Error(`Events dependency ${alias} is missing a "match" option which should be an object of event-meta-key -> filter value pairs.`)
  }


  const stream = options.stream || "write_model_stream";
  const match = normalizeEventMetadataMatcher(options.match);
  const reverse = !!options.latestFirst;

  return await mapMetadataFromEventStore(await asyncIterableToArray(await eventStore.load(stream, match, undefined, options.limit, reverse)));
}
