import {Query, QueryResolver} from "@event-engine/messaging/query";
import {QueryDescription} from "@event-engine/descriptions/descriptions";
import {queryResolverExtensions} from "@server/extensions/query-resolvers";
import {queryResolvers} from "@server/query-resolvers/index";
import {Payload} from "@event-engine/messaging/message";
import {QueryBus} from "@event-engine/messaging/query-bus";

export const SERVICE_NAME_QUERY_BUS = '$QueryBus';

class LiveQueryBus implements QueryBus {
  public async dispatch<S extends Payload = any>(query: Query, desc: QueryDescription): Promise<S> {
    const resolver = this.getResolver<S>(desc);
    return await resolver(query);
  }

  private getResolver<S extends Payload = any> (desc: QueryDescription): QueryResolver<S> {
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
