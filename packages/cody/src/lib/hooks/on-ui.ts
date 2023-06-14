import {CodyHook, NodeType} from "@proophboard/cody-types";
import {Context} from "./context";
import {getSourcesOfType, isCodyError, parseJsonMetadata} from "@proophboard/cody-utils";
import {getNodeFromSyncedNodes} from "./utils/node-tree";
import {withErrorCheck} from "./utils/error-handling";
import {getVoMetadata} from "./utils/value-object/get-vo-metadata";
import {isQueryableStateDescription} from "@event-engine/descriptions/descriptions";
import {Rule} from "./utils/rule-engine/configuration";
import {loadPageDefinition} from "./utils/ui/load-page-definition";
import {PageDefinition} from "@frontend/app/pages/page-definitions";

export interface UiMeta {
  route?: string;
  routeParams?: string[];
  sidebar?: {label?: string; icon?: string; show?: boolean | Rule[]};
  breadcrumb?: string;
  dynamicBreadcrumb?: Rule[];
}

export const onUi: CodyHook<Context> = async (ui, ctx) => {
  const uiMeta = withErrorCheck(parseJsonMetadata, [ui]) as UiMeta;
  let isTopLevelPage = !uiMeta.routeParams;
  const routeParams: string[] = uiMeta.routeParams || [];

  const viewModels = getSourcesOfType(ui, NodeType.document, true, true, true);

  if(isCodyError(viewModels)) {
    return viewModels;
  }

  viewModels.forEach(vM => {
    const syncedVm = withErrorCheck(getNodeFromSyncedNodes, [vM, ctx.syncedNodes]);
    const vMMeta = withErrorCheck(getVoMetadata, [syncedVm, ctx]);

    if(isQueryableStateDescription(vMMeta)) {
      isTopLevelPage = false;
      if(!routeParams.includes(vMMeta.identifier)) {
        routeParams.push(vMMeta.identifier);
      }
    }
  })

  const pageDefinitionOrError = await loadPageDefinition(ui, ctx);
  const existingPageDefinition: PageDefinition | undefined = isCodyError(pageDefinitionOrError) ? undefined : pageDefinitionOrError;


}
