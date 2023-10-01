import {ApiQuery} from "@frontend/queries/use-api-query";
import {getConfiguredPlayDocumentStore} from "@cody-play/infrastructure/multi-model-store/configured-document-store";
import {filters} from "@event-engine/infrastructure/DocumentStore/Filter/index";
import {asyncIteratorToArray} from "@event-engine/infrastructure/helpers/async-iterator-to-array";
import {asyncMap} from "@event-engine/infrastructure/helpers/async-map";
import {CarListDesc} from "@app/shared/types/fleet-management/car/car-list.desc";
import {Car, car} from "@app/shared/types/fleet-management/car/car";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {CONTACT_PB_TEAM} from "@cody-play/infrastructure/error/message";
import {
  isQueryableStateDescription,
  isQueryableStateListDescription,
  isQueryableValueObjectDescription,
  QueryableStateDescription,
  QueryableStateListDescription,
  QueryableValueObjectDescription
} from "@event-engine/descriptions/descriptions";
import {PlayQueryRuntimeInfo} from "@cody-play/state/types";
import {NotFoundError} from "@event-engine/messaging/error/not-found-error";
import {determineQueryPayload} from "@app/shared/utils/determine-query-payload";
import {QueryRuntimeInfo} from "@event-engine/messaging/query";
import {User} from "@app/shared/types/core/user/user";
import {JSONSchema7} from "json-schema-to-ts";
import {SortOrder, SortOrderItem} from "@event-engine/infrastructure/DocumentStore";
import {AnyRule} from "@cody-engine/cody/hooks/utils/rule-engine/configuration";
import {makeInformationFactory} from "@cody-play/infrastructure/information/make-information-factory";
import {ResolveConfig} from "@cody-engine/cody/hooks/utils/value-object/types";
import {
  makeFiltersFromQuerySchema,
  makeFiltersFromResolveConfig,
  mapOrderByProp
} from "@cody-play/queries/make-filters";

const ds = getConfiguredPlayDocumentStore();

export const makeLocalApiQuery = (store: CodyPlayConfig, user: User): ApiQuery => {
  return async (queryName: string, params: any): Promise<any> => {

    if(queryName === 'FleetManagement.GetCarList') {
      const cursor = await ds.findDocs<{state: Car}>(CarListDesc.collection, new filters.AnyFilter());

      return asyncIteratorToArray(asyncMap(cursor, ([, d]) => car(d.state)));
    }

    const queryInfo = store.queries[queryName];

    if(!queryInfo) {
      throw new Error(`Cannot perform query "${queryName}". Query info cannot be found. Did you forget to pass the corresponding Information card to Cody?`);
    }

    const informationName = queryInfo.desc.returnType;

    const informationInfo = store.types[informationName];

    if(!informationInfo) {
      throw new Error(`Cannot find Information about query return type: "${informationName}" of query: "${queryName}". ${CONTACT_PB_TEAM}`);
    }

    const informationDesc = informationInfo.desc;
    const resolve = store.resolvers[queryName] || {};

    if(isQueryableStateDescription(informationDesc)) {
      return await resolveStateQuery(informationDesc, informationInfo.factory, queryInfo, params);
    }

    if(isQueryableStateListDescription(informationDesc)) {
      return await resolveStateListQuery(informationDesc, informationInfo.factory, queryInfo, resolve, params, user)
    }

    if(isQueryableValueObjectDescription(informationDesc)) {
      return await resolveSingleValueObjectQuery(informationDesc, informationInfo.factory, queryInfo, resolve, params, user);
    }

    throw new Error(`Cannot resolve query "${queryName}", because the query return type is not supported. ${CONTACT_PB_TEAM}`);
  }
}

const resolveStateQuery = async (desc: QueryableStateDescription, factory: AnyRule[], queryInfo: PlayQueryRuntimeInfo, params: any): Promise<any> => {
  if(typeof params !== "object" || !params[desc.identifier]) {
    throw new Error(`Cannot resolve query: "${queryInfo.desc.name}". Query property "${desc.identifier}" is missing in query payload. This error can be caused by a wrong mapping. Please check potential metadata configuration.`);
  }

  const doc = await ds.getDoc<{state: any}>(desc.collection, params[desc.identifier]);

  if(!doc) {
    throw new NotFoundError(`"${desc.name}" with "${desc.identifier}": "${params[desc.identifier]}" not found!`);
  }

  const exe = makeInformationFactory(factory);

  return exe(doc.state);
}

const resolveStateListQuery = async (desc: QueryableStateListDescription, factory: AnyRule[], queryInfo: PlayQueryRuntimeInfo, resolve: ResolveConfig, params: any, user: User): Promise<Array<any>> => {
  const queryPayload = determineQueryPayload(params, queryInfo as unknown as QueryRuntimeInfo);

  const filters = resolve.where ? makeFiltersFromResolveConfig(desc, resolve, queryPayload, user) : makeFiltersFromQuerySchema(queryInfo.schema as JSONSchema7, queryPayload, user);

  let orderBy: SortOrder | undefined = undefined;

  if(resolve.orderBy) {
    orderBy = Array.isArray(resolve.orderBy)
      ? (resolve.orderBy as SortOrder).map(orderBy => mapOrderByProp(orderBy))
      : [mapOrderByProp(resolve.orderBy as SortOrderItem)];
  }

  const exe = makeInformationFactory(factory);

  const cursor = await ds.findDocs<{state: any}>(desc.collection, filters, undefined, undefined, orderBy);

  return asyncIteratorToArray(asyncMap(cursor, ([, d]) => exe(d.state)));
}

const resolveSingleValueObjectQuery = async (desc: QueryableValueObjectDescription, factory: AnyRule[], queryInfo: PlayQueryRuntimeInfo, resolve: ResolveConfig, params: any, user: User): Promise<any> => {
  const queryPayload = determineQueryPayload(params, queryInfo as unknown as QueryRuntimeInfo);

  const filters = resolve.where ? makeFiltersFromResolveConfig(desc, resolve, params, user) : makeFiltersFromQuerySchema(queryInfo.schema as JSONSchema7, params, user);

  let orderBy: SortOrder | undefined = undefined;

  if(resolve.orderBy) {
    orderBy = Array.isArray(resolve.orderBy)
      ? (resolve.orderBy as SortOrder).map(orderBy => mapOrderByProp(orderBy))
      : [mapOrderByProp(resolve.orderBy as SortOrderItem)];
  }

  const exe = makeInformationFactory(factory);

  const cursor = await ds.findDocs<{state: any}>(desc.collection, filters, undefined, 1, orderBy);

  const result = await asyncIteratorToArray(asyncMap(cursor, ([, d]) => exe(d.state)));

  if(result.length !== 1) {
    throw new NotFoundError(`"${desc.name}" with "${JSON.stringify(params)}" not found!`);
  }
}

