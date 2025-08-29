import {ApiQuery} from "@frontend/queries/use-api-query";
import {getConfiguredPlayDocumentStore} from "@cody-play/infrastructure/multi-model-store/configured-document-store";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {CONTACT_PB_TEAM} from "@cody-play/infrastructure/error/message";
import {determineQueryPayload} from "@app/shared/utils/determine-query-payload";
import {QueryRuntimeInfo} from "@event-engine/messaging/query";
import {User} from "@app/shared/types/core/user/user";
import {
  playInformationServiceFactory
} from "@cody-play/infrastructure/infromation-service/play-information-service-factory";
import {playLoadDependencies} from "@cody-play/infrastructure/cody/dependencies/play-load-dependencies";
import {makeQueryFactory} from "@cody-play/queries/make-query-factory";
import {
  resolve,
  ResolvedCtx,
} from "@cody-play/queries/resolve";

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

    const resolveConfig = store.resolvers[queryName] || {};
    const queryFactory = makeQueryFactory(queryInfo, store.definitions);
    const payload = determineQueryPayload(params, queryInfo as unknown as QueryRuntimeInfo)
    const dependencies = await playLoadDependencies(queryFactory(payload, {user}), 'query', queryInfo.desc.dependencies || {}, store);

    const resolvedCtx: ResolvedCtx = {...dependencies, query: params, meta: {user}};

    return resolve(ds, infoService, resolveConfig, informationInfo, queryInfo, resolvedCtx, store, user, true);
  }
}
