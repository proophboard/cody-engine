import {CommandDescription, PolicyDescription} from "@event-engine/descriptions/descriptions";
import {queries} from "@app/shared/queries";
import {determineQueryPayload} from "@app/shared/utils/determine-query-payload";
import {services} from "@server/extensions/services";
import {Message} from "@event-engine/messaging/message";
import {getConfiguredMessageBox} from "@server/infrastructure/configuredMessageBox";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {INFORMATION_SERVICE_NAME} from "@event-engine/infrastructure/information-service/information-service";
import {EventMatcher} from "@event-engine/infrastructure/EventStore";
import {Event} from "@event-engine/messaging/event";
import {normalizeEventMetadataMatcher} from "@app/shared/utils/normalize-event-metadata-matcher";
import {mapMetadataFromEventStore} from "@event-engine/infrastructure/EventStore/map-metadata-from-event-store";
import {asyncIterableToArray} from "@app/shared/utils/async-iterable-to-array";
import {getConfiguredEventStore} from "@server/infrastructure/configuredEventStore";
import {execMappingAsync} from "@app/shared/rule-engine/exec-mapping";

const cloneDeepJSON = <T>(val: T): T => {
  return JSON.parse(JSON.stringify(val));
}

export type MessageType = 'command' | 'event' | 'query';

export class MessageBus {
  protected async loadDependencies(message: Message, desc: CommandDescription | PolicyDescription, type: MessageType): Promise<any> {

    const {dependencies} = desc;
    const loadedDependencies: Record<string, any> = {};

    if(!dependencies && type !== 'event') {
      return loadedDependencies;
    }

    for (const dependencyKey in dependencies) {
      let depOrDepArr = dependencies[dependencyKey];

      if(!Array.isArray(depOrDepArr)) {
        depOrDepArr = [depOrDepArr];
      }

      for(const dep of depOrDepArr) {
        const depName = dep.alias || dependencyKey;

        if (dep.if) {
          const ctx: any = {meta: message.meta, name: message.name};

          ctx[type] = message.payload;

          if (!await jexl.eval(dep.if, ctx)) {
            continue;
          }
        }

        const messageDep: Record<string, object> = {};
        messageDep[type] = message.payload;

        switch (dep.type) {
          case "query":
            const options = cloneDeepJSON(dep.options || {});
            if (options.query) {
              const payload: Record<string, any> = {};

              for (const prop in options.query) {
                payload[prop] = await jexl.eval(options.query[prop], {
                  ...loadedDependencies, ...messageDep,
                  meta: message.meta
                });
              }

              options.query = payload;
            }

            loadedDependencies[depName] = await this.loadQueryDependency(dependencyKey, message, options);
            break;
          case "service":
            loadedDependencies[depName] = this.loadServiceDependency(dependencyKey, message, dep.options);
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

            loadedDependencies[depName] = await this.loadEventsDependency(depName, {...dep.options, match: compiledMatch});
            break;
          default:
            throw new Error(`Unknown dependency type detected for "${message.name}". Supported dependency types are: "query", "service", "events". But the configured type is "${dep.type}"`);
        }
      }
    }

    // Always add Information Service so that read model rules can access it
    if(type === "event") {
      loadedDependencies[INFORMATION_SERVICE_NAME] = this.loadServiceDependency(INFORMATION_SERVICE_NAME, message, {});
    }

    return loadedDependencies;
  }

  private async loadQueryDependency(queryName: string, message: Message, options: any): Promise<any> {
    if(!queries[queryName]) {
      throw new Error(`Query with name "${queryName}" cannot be found, but is configured as a dependency for "${message.name}"`);
    }

    const queryRuntimeInfo = queries[queryName];
    const keyMapping = options?.mapping || {};
    const queryPayload = options?.query || message.payload;

    const query = queryRuntimeInfo.factory(determineQueryPayload(queryPayload, queryRuntimeInfo, keyMapping), message.meta);

    return await getConfiguredMessageBox().queryBus.dispatch(query, queryRuntimeInfo.desc);
  }

  protected loadServiceDependency(serviceName: string, message: Message, options?: any): any {
    if(!services[serviceName]) {
      throw new Error(`Service factory for service with name "${serviceName}" not found in @extensions/be/services registry. The service is configured as dependency for "${message.name}".`);
    }

    const serviceFactory = services[serviceName];

    if(typeof serviceFactory !== "function") {
      throw new Error(`Service factory for service with name "${serviceName}" is not a function. Please check registry in @extensions/be/services. The service is configured as dependency for "${message.name}".`);
    }

    return serviceFactory(options);
  }

  private async loadEventsDependency(alias: string, options: {stream?: string, match: EventMatcher, limit?: number, latestFirst?: boolean}): Promise<Event[]> {
    if(!options.match || typeof options.match !== "object") {
      throw new Error(`Events dependency ${alias} is missing a "match" option which should be an object of event-meta-key -> filter value pairs.`)
    }


    const stream = options.stream || "write_model_stream";
    const match = normalizeEventMetadataMatcher(options.match);
    const reverse = !!options.latestFirst;

    return await mapMetadataFromEventStore(
      await asyncIterableToArray(
        await getConfiguredEventStore().load(stream, match, undefined, options.limit, reverse)
      )
    );
  }
}
