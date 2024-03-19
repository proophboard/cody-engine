import {ApiQuery} from "@frontend/queries/use-api-query";
import {getConfiguredPlayDocumentStore} from "@cody-play/infrastructure/multi-model-store/configured-document-store";
import {asyncIteratorToArray} from "@event-engine/infrastructure/helpers/async-iterator-to-array";
import {asyncMap} from "@event-engine/infrastructure/helpers/async-map";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {CONTACT_PB_TEAM} from "@cody-play/infrastructure/error/message";
import {
  isQueryableListDescription,
  isQueryableNotStoredStateDescription,
  isQueryableNotStoredStateListDescription,
  isQueryableNotStoredValueObjectDescription,
  isQueryableStateDescription,
  isQueryableStateListDescription,
  isQueryableValueObjectDescription,
  QueryableListDescription,
  QueryableNotStoredStateDescription, QueryableNotStoredValueObjectDescription,
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
} from "@cody-play/queries/make-filters";
import {mapOrderBy} from "@cody-engine/cody/hooks/utils/query/map-order-by";
import {
  playInformationServiceFactory
} from "@cody-play/infrastructure/infromation-service/play-information-service-factory";
import {INFORMATION_SERVICE_NAME} from "@server/infrastructure/information-service/information-service";
import {validateResolverRules} from "@cody-engine/cody/hooks/utils/rule-engine/validate-resolver-rules";
import {makeAsyncExecutable} from "@cody-play/infrastructure/rule-engine/make-executable";
import {playLoadDependencies} from "@cody-play/infrastructure/cody/dependencies/play-load-dependencies";
import {makeQueryFactory} from "@cody-play/queries/make-query-factory";

type ResolvedCtx = {query: Record<string, unknown>, meta: {user: User}, information?: unknown} & Record<string, unknown>;

const ds = getConfiguredPlayDocumentStore();
const infoService = playInformationServiceFactory();

export const makeLocalApiQuery = (store: CodyPlayConfig, user: User): ApiQuery => {
  return async (queryName: string, params: any): Promise<any> => {

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
    const queryFactory = makeQueryFactory(queryInfo, store.definitions);
    const payload = determineQueryPayload(params, queryInfo as unknown as QueryRuntimeInfo)
    const dependencies = await playLoadDependencies(queryFactory(payload, {user}), 'query', queryInfo.desc.dependencies || {}, store);

    let resolvedCtx: ResolvedCtx = {...dependencies, query: params, meta: {user}};

    if(resolve.rules) {
      const rulesCtx: Record<string, unknown> = {...dependencies, query: params, meta: {user}};
      rulesCtx[INFORMATION_SERVICE_NAME] = infoService;

      validateResolverRules(resolve.rules);

      resolvedCtx = await (makeAsyncExecutable(resolve.rules))(rulesCtx);
    }

    if(isQueryableNotStoredStateDescription(informationDesc)) {
      return await resolveNotStoredStateQuery(informationDesc, informationInfo.factory, queryInfo, resolvedCtx);
    }

    if(isQueryableStateDescription(informationDesc)) {
      return await resolveStateQuery(informationDesc, informationInfo.factory, queryInfo, resolvedCtx.query);
    }

    if(isQueryableNotStoredStateListDescription(informationDesc)) {
      const itemInfo = store.types[informationDesc.itemType];

      if(!itemInfo) {
        throw new Error(`[CodyPlay] List item type "${informationDesc.itemType}" is unknown. Did you forget to pass it from prooph board to Cody Play?`)
      }

      return await resolveNotStoredListQuery(informationDesc, itemInfo.factory, queryInfo, resolve, resolvedCtx);
    }

    if(isQueryableStateListDescription(informationDesc)) {
      let itemInfo = store.types[informationDesc.itemType];

      if(!itemInfo) {
        // @TODO: throw exception, but ensure BC first
        // throw new Error(`[CodyPlay] List item type "${informationDesc.itemType}" is unknown. Did you forget to pass it from prooph board to Cody Play?`)
        itemInfo = informationInfo;
      }

      return await resolveStateListQuery(informationDesc, itemInfo.factory, queryInfo, resolve, resolvedCtx.query, user)
    }

    if(isQueryableValueObjectDescription(informationDesc)) {
      return await resolveSingleValueObjectQuery(informationDesc, informationInfo.factory, queryInfo, resolve, resolvedCtx.query, user);
    }

    if(isQueryableNotStoredValueObjectDescription(informationDesc)) {
      return await resolveNotStoredValueObjectQuery(informationDesc, informationInfo.factory, queryInfo, resolvedCtx);
    }

    if(isQueryableListDescription(informationDesc)) {
      let itemInfo = store.types[informationDesc.itemType];

      if(!itemInfo) {
        // @TODO: throw exception, but ensure BC first
        // throw new Error(`[CodyPlay] List item type "${informationDesc.itemType}" is unknown. Did you forget to pass it from prooph board to Cody Play?`)
        itemInfo = informationInfo;
      }

      return await resolveNotStoredListQuery(informationDesc, itemInfo.factory, queryInfo, resolve, resolvedCtx);
    }

    throw new Error(`Cannot resolve query "${queryName}", because the query return type is not supported. ${CONTACT_PB_TEAM}`);
  }
}

const resolveNotStoredStateQuery = async (desc: QueryableNotStoredStateDescription, factory: AnyRule[], queryInfo: PlayQueryRuntimeInfo, ctx: ResolvedCtx): Promise<any> => {
  const doc = ctx.information;

  if(!doc) {
    throw new NotFoundError(`"${desc.name}" with "${desc.identifier}": "${ctx.query[desc.identifier]}" not found!`);
  }

  console.log(`[CodyPlay] Performed not stored state query "${desc.name}" {${desc.identifier}: "${ctx.query[desc.identifier]}"}`, doc);

  const exe = makeInformationFactory(factory);

  return exe(doc);
}

const resolveNotStoredValueObjectQuery = async (desc: QueryableNotStoredValueObjectDescription, factory: AnyRule[], queryInfo: PlayQueryRuntimeInfo, ctx: ResolvedCtx): Promise<any> => {
  const doc = ctx.information;

  if(!doc) {
    throw new NotFoundError(`"${desc.name}" with "${ctx.query}" not found!`);
  }

  console.log(`[CodyPlay] Performed not stored ValueObject query "${desc.name}" with "${ctx.query}"`, doc);

  const exe = makeInformationFactory(factory);

  return exe(doc);
}

const resolveStateQuery = async (desc: QueryableStateDescription, factory: AnyRule[], queryInfo: PlayQueryRuntimeInfo, params: any): Promise<any> => {
  if(typeof params !== "object" || !params[desc.identifier]) {
    throw new Error(`Cannot resolve query: "${queryInfo.desc.name}". Query property "${desc.identifier}" is missing in query payload. This error can be caused by a wrong mapping. Please check potential metadata configuration.`);
  }

  const doc = await ds.getDoc<any>(desc.collection, params[desc.identifier]);

  if(!doc) {
    throw new NotFoundError(`"${desc.name}" with "${desc.identifier}": "${params[desc.identifier]}" not found!`);
  }

  console.log(`[CodyPlay] Performed State query "${desc.name}" {${desc.identifier}: "${params[desc.identifier]}"}`, doc);

  const exe = makeInformationFactory(factory);

  return exe(doc);
}

const resolveStateListQuery = async (desc: QueryableStateListDescription, factory: AnyRule[], queryInfo: PlayQueryRuntimeInfo, resolve: ResolveConfig, params: any, user: User): Promise<Array<any>> => {
  const queryPayload = determineQueryPayload(params, queryInfo as unknown as QueryRuntimeInfo);

  const filters = resolve.where ? makeFiltersFromResolveConfig(desc, resolve, queryPayload, user) : makeFiltersFromQuerySchema(queryInfo.schema as JSONSchema7, queryPayload, user);

  let orderBy: SortOrder | undefined = undefined;

  if(resolve.orderBy) {
    orderBy = mapOrderBy(resolve.orderBy);
  }

  const exe = makeInformationFactory(factory);

  const cursor = await ds.findDocs<any>(desc.collection, filters, undefined, undefined, orderBy);

  const result = asyncIteratorToArray(asyncMap(cursor, ([, d]) => exe(d)));

  console.log(`[CodyPlay] Performed StateList query "${desc.name}":`, queryPayload, result);

  return result;
}

const resolveSingleValueObjectQuery = async (desc: QueryableValueObjectDescription, factory: AnyRule[], queryInfo: PlayQueryRuntimeInfo, resolve: ResolveConfig, params: any, user: User): Promise<any> => {
  const queryPayload = determineQueryPayload(params, queryInfo as unknown as QueryRuntimeInfo);

  const filters = resolve.where
    ? makeFiltersFromResolveConfig(desc, resolve, params, user) :
      makeFiltersFromQuerySchema(queryInfo.schema as JSONSchema7, params, user);

  let orderBy: SortOrder | undefined = undefined;

  if(resolve.orderBy) {
    orderBy = mapOrderBy(resolve.orderBy);
  }

  const exe = makeInformationFactory(factory);

  const cursor = await ds.findDocs<any>(desc.collection, filters, undefined, 1, orderBy);

  const result = await asyncIteratorToArray(asyncMap(cursor, ([, d]) => exe(d)));

  if(result.length !== 1) {
    throw new NotFoundError(`"${desc.name}" with "${JSON.stringify(params)}" not found!`);
  }

  console.log(`[CodyPlay] Performed SingleValueObject query "${desc.name}" {${filters}"}`, result[0]);

  return result[0];
}

const resolveNotStoredListQuery = async (desc: QueryableListDescription, factory: AnyRule[], queryInfo: PlayQueryRuntimeInfo, resolve: ResolveConfig, ctx: ResolvedCtx): Promise<any> => {
  const exe = makeInformationFactory(factory);

  if(!ctx.information) {
    throw new Error(`[CodyPlay] Query resolver rules for ${desc.name} do not assign an "information" variable. The variable should contain the query result. Please check your prooph board query resolver rules.`)
  }

  const result = ctx.information;

  if(!Array.isArray(result)) {
    throw new Error(`[CodyPlay] Query resolver "information" result for ${desc.name} is not a list, but the data schema is defined as a list. Please check your prooph board query resolver rules.`)
  }

  console.log(`[CodyPlay] Performed not stored List query "${desc.name}"`, ctx, result);

  return result.map(item => exe(item));
}

