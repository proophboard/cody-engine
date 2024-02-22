import {CodyHook, NodeType} from "@proophboard/cody-types";
import {Context} from "./context";
import {getSourcesOfType, getTargetsOfType, isCodyError, parseJsonMetadata} from "@proophboard/cody-utils";
import {asyncWithErrorCheck, CodyResponseException, withErrorCheck} from "./utils/error-handling";
import {getUiMetadata} from "./utils/ui/get-ui-metadata";
import {getNodeFromSyncedNodes} from "./utils/node-tree";
import {getVoMetadata} from "./utils/value-object/get-vo-metadata";
import {
  isQueryableListDescription, isQueryableNotStoredStateDescription, isQueryableNotStoredValueObjectDescription,
  isQueryableStateDescription,
  isQueryableStateListDescription, isQueryableValueObjectDescription
} from "@event-engine/descriptions/descriptions";
import {isTopLevelPage} from "./utils/ui/is-top-level-page";
import {detectRoute} from "./utils/ui/detect-route";
import {loadPageDefinition} from "./utils/ui/load-page-definition";
import {upsertSubLevelPage, upsertTopLevelPage} from "./utils/ui/upsert-page-definition";
import {flushChanges, FsTree} from "nx/src/generators/tree";
import {listChangesForCodyResponse} from "./utils/fs-tree";
import {isSubLevelPage} from "@frontend/app/pages/page-definitions";
import {formatFiles} from "@nx/devkit";
import {register} from "./utils/registry";
import {upsertCommandComponent} from "./utils/ui/upsert-command-component";
import {upsertListViewComponent} from "./utils/ui/upsert-list-view-component";
import {upsertStateViewComponent} from "./utils/ui/upsert-state-view-component";

export const onUi: CodyHook<Context> = async (ui, ctx) => {
  try {

    const uiMeta = withErrorCheck(getUiMetadata, [ui, ctx]);
    const routeParams: string[] = uiMeta.routeParams || [];

    const viewModels = withErrorCheck(getSourcesOfType, [ui, NodeType.document, true, true, true]);

    viewModels.forEach(vM => {
      const syncedVm = withErrorCheck(getNodeFromSyncedNodes, [vM, ctx.syncedNodes]);
      const vMMeta = withErrorCheck(getVoMetadata, [syncedVm, ctx]);

      if(isQueryableStateDescription(vMMeta) || isQueryableNotStoredStateDescription(vMMeta)) {
        if(!routeParams.includes(vMMeta.identifier)) {
          routeParams.push(vMMeta.identifier);
        }
      }
    })

    const commands = withErrorCheck(getTargetsOfType, [ui, NodeType.command, true, true, true])
      .map(cmd => withErrorCheck(getNodeFromSyncedNodes, [cmd, ctx.syncedNodes]));

    const pageDefinition = await loadPageDefinition(ui, ctx);

    if(!isCodyError(pageDefinition) && isSubLevelPage(pageDefinition)) {
      pageDefinition.routeParams.reverse().forEach(p => {
        if(!routeParams.includes(p)) {
          routeParams.unshift(p);
        }
      })
    }

    const topLevelPage = withErrorCheck(isTopLevelPage, [ui, uiMeta, ctx]);
    const route = await asyncWithErrorCheck(detectRoute, [ui, uiMeta, topLevelPage, ctx, routeParams, isCodyError(pageDefinition)? undefined : pageDefinition]);

    const {tree} = ctx;

    if(topLevelPage) {
      await asyncWithErrorCheck(
        upsertTopLevelPage,
        [ui, uiMeta, ctx, tree, commands, viewModels, route, isCodyError(pageDefinition)? undefined : pageDefinition]
      )
    } else {
      await asyncWithErrorCheck(
        upsertSubLevelPage,
        [ui, uiMeta, ctx, tree, commands, viewModels, route, routeParams, isCodyError(pageDefinition)? undefined : pageDefinition]
      );
    }

    withErrorCheck(register, [ui, ctx, tree]);

    for (const command of commands) {
      await asyncWithErrorCheck(upsertCommandComponent, [command, ctx, tree]);
    }

    for (const viewModel of viewModels) {
      const viewModelMeta = withErrorCheck(getVoMetadata, [viewModel, ctx]);

      if(isQueryableStateListDescription(viewModelMeta) || isQueryableListDescription(viewModelMeta)) {
        await asyncWithErrorCheck(upsertListViewComponent, [viewModel, viewModelMeta, ctx, tree]);
      }

      if(isQueryableStateDescription(viewModelMeta) || isQueryableNotStoredStateDescription(viewModelMeta) || isQueryableValueObjectDescription(viewModelMeta) || isQueryableNotStoredValueObjectDescription(viewModelMeta)) {
        await asyncWithErrorCheck(upsertStateViewComponent, [viewModel, viewModelMeta, ctx, tree]);
      }
    }

    await formatFiles(tree);

    const changes = tree.listChanges();

    flushChanges(ctx.projectRoot, changes);

    return {
      cody: `The UI page "${ui.getName()}" is added to the app.`,
      details: listChangesForCodyResponse(tree)
    }
  } catch (e) {
    if(e instanceof CodyResponseException) {
      return e.codyResponse;
    }

    throw e;
  }
}
