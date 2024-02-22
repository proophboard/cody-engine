import {Query, QueryResolver, QueryResolverWithDependencies} from "@event-engine/messaging/query";
import {QueryDescription} from "@event-engine/descriptions/descriptions";
import {queryResolverExtensions} from "@server/extensions/query-resolvers";
import {queryResolvers} from "@server/query-resolvers/index";
import {Payload} from "@event-engine/messaging/message";
import {QueryBus} from "@event-engine/messaging/query-bus";
import {MessageBus} from "@server/infrastructure/MessageBus";

export const SERVICE_NAME_QUERY_BUS = '$QueryBus';

class LiveQueryBus extends MessageBus implements QueryBus {
  public async dispatch<S extends Payload = any, D = any>(query: Query, desc: QueryDescription): Promise<S> {
    const resolver = this.getResolver<S, D>(desc);
    const dependencies = await this.loadDependencies(query, desc, 'query');
    return await resolver(query, dependencies);
  }

  private getResolver<S extends Payload = any, D = any> (desc: QueryDescription): QueryResolver<S> | QueryResolverWithDependencies<S, D> {
    if(queryResolverExtensions[desc.name]) {
      return queryResolverExtensions[desc.name];
    }

    if(!queryResolvers[desc.name]) {
      throw new Error(`No query resolver registered for query "${desc.name}".`);
    }

    return queryResolvers[desc.name];
  }
}

let queryBus: LiveQueryBus;

export const getConfiguredQueryBus = (): LiveQueryBus => {
  if(!queryBus) {
    queryBus = new LiveQueryBus();
  }

  return queryBus;
}
