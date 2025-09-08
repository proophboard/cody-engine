import {
  isQueryableListDescription,
  isQueryableNotStoredStateDescription,
  isQueryableNotStoredStateListDescription, isQueryableNotStoredValueObjectDescription,
  isQueryableStateDescription,
  isQueryableStateListDescription, isQueryableValueObjectDescription, isStoredQueryableListDescription,
  QueryableListDescription,
  QueryableNotStoredStateDescription,
  QueryableNotStoredValueObjectDescription,
  QueryableStateDescription,
  QueryableStateListDescription,
  QueryableValueObjectDescription,
  StoredQueryableListDescription
} from "@event-engine/descriptions/descriptions";
import {AnyRule} from "@app/shared/rule-engine/configuration";
import {PlayInformationRuntimeInfo, PlayQueryRuntimeInfo} from "@cody-play/state/types";
import {ResolveConfig} from "@cody-engine/cody/hooks/utils/value-object/types";
import {makeInformationFactory} from "@cody-play/infrastructure/information/make-information-factory";
import {Palette} from "@cody-play/infrastructure/utils/styles";
import {User} from "@app/shared/types/core/user/user";
import {determineQueryPayload} from "@app/shared/utils/determine-query-payload";
import {QueryRuntimeInfo} from "@event-engine/messaging/query";
import {makeFiltersFromQuerySchema, makeFiltersFromResolveConfig} from "@cody-play/queries/make-filters";
import {JSONSchema7} from "json-schema-to-ts";
import {DocumentStore, SortOrder} from "@event-engine/infrastructure/DocumentStore";
import {mapOrderBy} from "@cody-engine/cody/hooks/utils/query/map-order-by";
import {asyncIteratorToArray} from "@event-engine/infrastructure/helpers/async-iterator-to-array";
import {asyncMap} from "@event-engine/infrastructure/helpers/async-map";
import {NotFoundError} from "@event-engine/messaging/error/not-found-error";
import {
  INFORMATION_SERVICE_NAME,
  InformationService
} from "@event-engine/infrastructure/information-service/information-service";
import {validateResolverRules} from "@cody-engine/cody/hooks/rule-engine/validate-resolver-rules";
import {makeAsyncExecutable} from "@cody-play/infrastructure/rule-engine/make-executable";
import {CONTACT_PB_TEAM} from "@cody-play/infrastructure/error/message";
import {CodyPlayConfig} from "@cody-play/state/config-store";

export type ResolvedCtx = {query: Record<string, unknown>, meta: {user: User}, information?: unknown} & Record<string, unknown>;

export const resolve = async (ds: DocumentStore, infoService: InformationService, resolveConfig: ResolveConfig, information: PlayInformationRuntimeInfo, queryInfo: PlayQueryRuntimeInfo, ctx: ResolvedCtx, playConfig: CodyPlayConfig, user: User, verbose = true) => {
  if(resolveConfig.rules) {
    ctx[INFORMATION_SERVICE_NAME] = infoService;

    validateResolverRules(resolveConfig.rules);

    ctx = await (makeAsyncExecutable(resolveConfig.rules))(ctx);

    if(verbose) {
      console.log(
        `%c[QueryBus] Executed resolve rules of query %c${queryInfo.desc.name}`, Palette.cColor(Palette.stickyColors.document), Palette.cColorBold(Palette.stickyColors.document),
        information.desc._pbLink,
        {
          ctx,
          rules: resolveConfig.rules
        }
      )
    } else {
      console.log(
        `%c[QueryBus] Executed resolve rules of query %c${queryInfo.desc.name}`, Palette.cColor(Palette.stickyColors.document), Palette.cColorBold(Palette.stickyColors.document),
        information.desc._pbLink,
      )
    }
  }

  const informationDesc = information.desc;

  if(isQueryableNotStoredStateDescription(informationDesc)) {
    return await resolveNotStoredStateQuery(informationDesc, information.factory, queryInfo, ctx, verbose);
  }

  if(isQueryableStateDescription(informationDesc)) {
    return await resolveStateQuery(ds, informationDesc, information.factory, queryInfo, ctx.query, verbose);
  }

  if(isQueryableNotStoredStateListDescription(informationDesc)) {
    const itemInfo = playConfig.types[informationDesc.itemType];

    if(!itemInfo) {
      throw new Error(`[CodyPlay] List item type "${informationDesc.itemType}" is unknown. Did you forget to pass it from prooph board to Cody Play?`)
    }

    return await resolveNotStoredListQuery(informationDesc, itemInfo.factory, queryInfo, resolveConfig, ctx, verbose);
  }

  if(isQueryableStateListDescription(informationDesc)) {
    let itemInfo = playConfig.types[informationDesc.itemType];

    if(!itemInfo) {
      // @TODO: throw exception, but ensure BC first
      // throw new Error(`[CodyPlay] List item type "${informationDesc.itemType}" is unknown. Did you forget to pass it from prooph board to Cody Play?`)
      itemInfo = information;
    }

    return await resolveStateListQuery(ds, informationDesc, itemInfo.factory, queryInfo, resolveConfig, ctx.query, user, verbose)
  }

  if(isQueryableValueObjectDescription(informationDesc)) {
    return await resolveSingleValueObjectQuery(ds, informationDesc, information.factory, queryInfo, resolveConfig, ctx.query, user, verbose);
  }

  if(isQueryableNotStoredValueObjectDescription(informationDesc)) {
    return await resolveNotStoredValueObjectQuery(informationDesc, information.factory, queryInfo, ctx, verbose);
  }

  if(isQueryableListDescription(informationDesc)) {
    let itemInfo = playConfig.types[informationDesc.itemType];

    if(!itemInfo) {
      // @TODO: throw exception, but ensure BC first
      // throw new Error(`[CodyPlay] List item type "${informationDesc.itemType}" is unknown. Did you forget to pass it from prooph board to Cody Play?`)
      itemInfo = information;
    }

    if(isStoredQueryableListDescription(informationDesc)) {
      return await resolveStateListQuery(ds, informationDesc, itemInfo.factory, queryInfo, resolveConfig, ctx.query, user, verbose);
    }

    return await resolveNotStoredListQuery(informationDesc, itemInfo.factory, queryInfo, resolveConfig, ctx, verbose);
  }

  throw new Error(`Cannot resolve query "${queryInfo.desc.name}", because the query return type is not supported. ${CONTACT_PB_TEAM}`);
}

const resolveNotStoredStateQuery = async (desc: QueryableNotStoredStateDescription, factory: AnyRule[], queryInfo: PlayQueryRuntimeInfo, ctx: ResolvedCtx, verbose: boolean): Promise<any> => {
  const doc = ctx.information;

  if(!doc) {
    throw new NotFoundError(`"${desc.name}" with "${desc.identifier}": "${ctx.query[desc.identifier]}" not found!`);
  }

  if(verbose) {
    console.log(
      `%c[QueryBus] Performed not stored state query %c${desc.name}`, Palette.cColor(Palette.stickyColors.document), Palette.cColorBold(Palette.stickyColors.document),
      desc._pbLink,
      {
        ctx,
        result: doc
      }
    )
  } else {
    console.log(
      `%c[QueryBus] Performed not stored state query %c${desc.name}`, Palette.cColor(Palette.stickyColors.document), Palette.cColorBold(Palette.stickyColors.document),
      desc._pbLink,
    )
  }


  const exe = makeInformationFactory(factory);

  return exe(doc);
}

const resolveNotStoredValueObjectQuery = async (desc: QueryableNotStoredValueObjectDescription, factory: AnyRule[], queryInfo: PlayQueryRuntimeInfo, ctx: ResolvedCtx, verbose: boolean): Promise<any> => {
  const doc = ctx.information;

  if(!doc) {
    throw new NotFoundError(`"${desc.name}" with "${ctx.query}" not found!`);
  }

  if(verbose) {
    console.log(
      `%c[QueryBus] Performed not stored ValueObject query %c${desc.name}`, Palette.cColor(Palette.stickyColors.document), Palette.cColorBold(Palette.stickyColors.document),
      desc._pbLink,
      {
        ctx,
        result: doc
      }
    )
  } else {
    console.log(
      `%c[QueryBus] Performed not stored ValueObject query %c${desc.name}`, Palette.cColor(Palette.stickyColors.document), Palette.cColorBold(Palette.stickyColors.document),
      desc._pbLink,
    )
  }


  const exe = makeInformationFactory(factory);

  return exe(doc);
}

const resolveStateQuery = async (ds: DocumentStore, desc: QueryableStateDescription, factory: AnyRule[], queryInfo: PlayQueryRuntimeInfo, params: any, verbose: boolean): Promise<any> => {
  if(typeof params !== "object" || !params[desc.identifier]) {
    throw new Error(`Cannot resolve query: "${queryInfo.desc.name}". Query property "${desc.identifier}" is missing in query payload. This error can be caused by a wrong mapping. Please check potential metadata configuration.`);
  }

  const doc = await ds.getDoc<any>(desc.collection, params[desc.identifier]);

  if(!doc) {
    throw new NotFoundError(`"${desc.name}" with "${desc.identifier}": "${params[desc.identifier]}" not found!`);
  }

  if(verbose) {
    console.log(
      `%c[QueryBus] Performed State query %c${desc.name}`, Palette.cColor(Palette.stickyColors.document), Palette.cColorBold(Palette.stickyColors.document),
      desc._pbLink,
      {
        params,
        result: doc
      }
    )
  } else {
    console.log(
      `%c[QueryBus] Performed State query %c${desc.name}`, Palette.cColor(Palette.stickyColors.document), Palette.cColorBold(Palette.stickyColors.document),
      desc._pbLink,
    )
  }


  const exe = makeInformationFactory(factory);

  return exe(doc);
}

const resolveStateListQuery = async (ds: DocumentStore, desc: QueryableStateListDescription | StoredQueryableListDescription, factory: AnyRule[], queryInfo: PlayQueryRuntimeInfo, resolve: ResolveConfig, params: any, user: User, verbose: boolean): Promise<Array<any>> => {
  const queryPayload = determineQueryPayload(params, queryInfo as unknown as QueryRuntimeInfo);

  const filters = resolve.where ? makeFiltersFromResolveConfig(desc, resolve, queryPayload, user) : makeFiltersFromQuerySchema(queryInfo.schema as JSONSchema7, queryPayload, user);

  let orderBy: SortOrder | undefined = undefined;

  if(resolve.orderBy) {
    orderBy = mapOrderBy(resolve.orderBy);
  }

  const exe = makeInformationFactory(factory);

  const cursor = await ds.findDocs<any>(desc.collection, filters, undefined, undefined, orderBy);

  const result = asyncIteratorToArray(asyncMap(cursor, ([, d]) => exe(d)));

  if(verbose) {
    console.log(
      `%c[QueryBus] Performed StateList query %c${desc.name}`, Palette.cColor(Palette.stickyColors.document), Palette.cColorBold(Palette.stickyColors.document),
      desc._pbLink,
      {
        queryPayload,
        result
      }
    )
  } else {
    console.log(
      `%c[QueryBus] Performed StateList query %c${desc.name}`, Palette.cColor(Palette.stickyColors.document), Palette.cColorBold(Palette.stickyColors.document),
      desc._pbLink,
    )
  }


  return result;
}

const resolveSingleValueObjectQuery = async (ds: DocumentStore, desc: QueryableValueObjectDescription, factory: AnyRule[], queryInfo: PlayQueryRuntimeInfo, resolve: ResolveConfig, params: any, user: User, verbose: boolean): Promise<any> => {
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

  if(verbose) {
    console.log(
      `%c[QueryBus] Performed SingleValueObject query %c${desc.name}`, Palette.cColor(Palette.stickyColors.document), Palette.cColorBold(Palette.stickyColors.document),
      desc._pbLink,
      {
        filters,
        result: result[0]
      }
    )
  } else {
    console.log(
      `%c[QueryBus] Performed SingleValueObject query %c${desc.name}`, Palette.cColor(Palette.stickyColors.document), Palette.cColorBold(Palette.stickyColors.document),
      desc._pbLink,
    )
  }


  return result[0];
}

const resolveNotStoredListQuery = async (desc: QueryableListDescription, factory: AnyRule[], queryInfo: PlayQueryRuntimeInfo, resolve: ResolveConfig, ctx: ResolvedCtx, verbose: boolean): Promise<any> => {
  const exe = makeInformationFactory(factory);

  if(!ctx.information) {
    throw new Error(`[CodyPlay] Query resolver rules for ${desc.name} do not assign an "information" variable. The variable should contain the query result. Please check your prooph board query resolver rules.`)
  }

  const result = ctx.information;

  if(!Array.isArray(result)) {
    throw new Error(`[CodyPlay] Query resolver "information" result for ${desc.name} is not a list, but the data schema is defined as a list. Please check your prooph board query resolver rules.`)
  }

  if(verbose) {
    console.log(
      `%c[QueryBus] Performed not stored List query %c${desc.name}`, Palette.cColor(Palette.stickyColors.document), Palette.cColorBold(Palette.stickyColors.document),
      desc._pbLink,
      {
        ctx,
        result
      }
    )
  } else {
    console.log(
      `%c[QueryBus] Performed not stored List query %c${desc.name}`, Palette.cColor(Palette.stickyColors.document), Palette.cColorBold(Palette.stickyColors.document),
      desc._pbLink,
    )
  }

  return result.map(item => exe(item));
}
