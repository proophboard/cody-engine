import {CommandDescription, PolicyDescription} from "@event-engine/descriptions/descriptions";
import {queries} from "@app/shared/queries";
import {determineQueryPayload} from "@app/shared/utils/determine-query-payload";
import {services} from "@server/extensions/services";
import {Message} from "@event-engine/messaging/message";
import {getConfiguredMessageBox} from "@server/infrastructure/configuredMessageBox";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {INFORMATION_SERVICE_NAME} from "@server/infrastructure/information-service/information-service";

export type MessageType = 'command' | 'event' | 'query';

export class MessageBus {
  protected async loadDependencies(message: Message, desc: CommandDescription | PolicyDescription, type: MessageType): Promise<any> {

    const {dependencies} = desc;
    const loadedDependencies: Record<string, any> = {};

    if(!dependencies && type !== 'event') {
      return loadedDependencies;
    }

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
          if(dep.options?.query) {
            const payload: Record<string, any> = {};

            const messageDep: Record<string, object> = {};
            messageDep[type] = message.payload;

            for (const prop in dep.options.query) {
              payload[prop] = await jexl.eval(dep.options.query[prop], {...loadedDependencies, ...messageDep});
            }

            dep.options.query = payload;
          }

          loadedDependencies[depName] = await this.loadQueryDependency(dependencyKey, message, dep.options);
          break;
        case "service":
          loadedDependencies[depName] = this.loadServiceDependency(dependencyKey, message, dep.options);
          break;
        default:
          throw new Error(`Unknown dependency type detected for "${message.name}". Supported dependency types are: "query", "service". But the configured type is "${dep.type}"`);
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

  private loadServiceDependency(serviceName: string, message: Message, options?: any): any {
    if(!services[serviceName]) {
      throw new Error(`Service factory for service with name "${serviceName}" not found in @extensions/be/services registry. The service is configured as dependency for "${message.name}".`);
    }

    const serviceFactory = services[serviceName];

    if(typeof serviceFactory !== "function") {
      throw new Error(`Service factory for service with name "${serviceName}" is not a function. Please check registry in @extensions/be/services. The service is configured as dependency for "${message.name}".`);
    }

    return serviceFactory(options);
  }
}
