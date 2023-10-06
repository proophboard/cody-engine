import {DependencyRegistry} from "@event-engine/descriptions/descriptions";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {Message} from "@event-engine/messaging/message";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {getConfiguredPlayAuthService} from "@cody-play/infrastructure/auth/configured-auth-service";
import {PlayQueryRegistry} from "@cody-play/state/types";
import {queries} from "@app/shared/queries";
import {determineQueryPayload} from "@app/shared/utils/determine-query-payload";
import {QueryRuntimeInfo} from "@event-engine/messaging/query";
import {makeLocalApiQuery} from "@cody-play/queries/local-api-query";
import {User} from "@app/shared/types/core/user/user";

export type PlayMessageType = 'command' | 'event' | 'query';

export const services: {[serviceName: string]: (options?: any) => any} = {
  AuthService: getConfiguredPlayAuthService,
}

export const playLoadDependencies = async (message: Message, type: PlayMessageType, dependencies: DependencyRegistry, config: CodyPlayConfig): Promise<any> => {
  const loadedDependencies: Record<string, any> = {};

  for (const dependencyKey in dependencies) {
    const dep = dependencies[dependencyKey];
    const depName = dep.alias || dependencyKey;

    if(dep.if) {
      const ctx: any = {meta: message.meta, name: message.name};

      ctx[type] = message.payload;

      if(! await jexl.eval(dep.if, ctx)) {
        continue;
      }
    }

    switch (dep.type) {
      case "query":
        loadedDependencies[depName] = await loadQueryDependency(dependencyKey, message, dep.options, config.queries, config);
        break;
      case "service":
        loadedDependencies[depName] = loadServiceDependency(dependencyKey, message, dep.options);
        break;
      default:
        throw new Error(`Unknown dependency type detected for "${message.name}". Supported dependency types are: "query", "service". But the configured type is "${dep.type}"`);
    }
  }

  return loadedDependencies;
}

const loadQueryDependency = (queryName: string, message: Message, options: any, queries: PlayQueryRegistry, config: CodyPlayConfig): Promise<any> => {
  if(!queries[queryName]) {
    throw new Error(`Query with name "${queryName}" cannot be found, but is configured as a dependency for "${message.name}"`);
  }

  const queryRuntimeInfo = queries[queryName];
  const keyMapping = options?.mapping || {};

  const queryParams = determineQueryPayload(message.payload, queryRuntimeInfo as unknown as QueryRuntimeInfo, keyMapping);

  return makeLocalApiQuery(config, message.meta.user as User)(queryName, queryParams);
}

const loadServiceDependency = (serviceName: string, message: Message, options?: any): any => {
  if(!services[serviceName]) {
    throw new Error(`Service factory for service with name "${serviceName}" not found in service registry. In Cody Play you can only use built-in services like the AuthService. The service is configured as dependency for "${message.name}".`);
  }

  const serviceFactory = services[serviceName];

  return serviceFactory(options);
}
