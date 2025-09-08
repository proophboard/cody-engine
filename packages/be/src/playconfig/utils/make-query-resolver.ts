import {PlayInformationRuntimeInfo, PlayQueryRuntimeInfo, PlaySchemaDefinitions} from "@cody-play/state/types";
import {ResolveConfig} from "@cody-play/infrastructure/cody/vo/play-vo-metadata";
import {QueryResolverWithDependencies} from "@event-engine/messaging/query";
import {User} from "@app/shared/types/core/user/user";
import {makeQueryFactory} from "@cody-play/queries/make-query-factory";
import {determineQueryPayload} from "@app/shared/utils/determine-query-payload";
import {getConfiguredDocumentStore} from "@server/infrastructure/configuredDocumentStore";
import {getExternalServiceOrThrow} from "@server/extensions/get-external-service";
import {
  INFORMATION_SERVICE_NAME,
  InformationService
} from "@event-engine/infrastructure/information-service/information-service";
import {resolve, ResolvedCtx} from "@cody-play/queries/resolve";
import {BePlayConfig} from "@server/playconfig/be-play-config";
import {CodyPlayConfig} from "@cody-play/state/config-store";


export const makeQueryResolver = (queryInfo: PlayQueryRuntimeInfo, resolveConfig: ResolveConfig, informationInfo: PlayInformationRuntimeInfo, playConfig: BePlayConfig): QueryResolverWithDependencies => {
  return async (query, dependencies) => {
    const ds = getConfiguredDocumentStore();
    const infoService = getExternalServiceOrThrow<InformationService>(INFORMATION_SERVICE_NAME, {});

    const resolvedCtx: ResolvedCtx = {...dependencies, query: query.payload, meta: query.meta};

    return resolve(ds, infoService, resolveConfig, informationInfo, queryInfo, resolvedCtx, playConfig as CodyPlayConfig, query.meta.user as User, false);
  }
}
