import {CodyResponse, CodyResponseType, Node} from "@proophboard/cody-types";
import {Context} from "../../context";
import {PageDefinition} from "@frontend/app/pages/page-definitions";
import {detectService} from "../detect-service";
import {isCodyError} from "@proophboard/cody-utils";
import {names} from "@event-engine/messaging/helpers";
import {requireUncached} from "../fs-tree";

export const getPageDefinitionPath = (ui: Node, ctx: Context): string | CodyResponse => {
  const service = detectService(ui, ctx);

  if(isCodyError(service)) {
    return service;
  }

  return `${ctx.feSrc}/pages/${names(service).fileName}/${names(ui.getName()).fileName}.ts`;
}

export const getPageDefinitionImport = (ui: Node, ctx: Context): string | CodyResponse => {
  const service = detectService(ui, ctx);

  if(isCodyError(service)) {
    return service;
  }

  return `@frontend/app/pages/${names(service).fileName}/${names(ui.getName()).fileName}`;
}

export const loadPageDefinition = async (ui: Node, ctx: Context): Promise<PageDefinition | CodyResponse> => {
  const importPath = getPageDefinitionImport(ui, ctx);

  if(isCodyError(importPath)) {
    return importPath;
  }

  const uiNames = names(ui.getName());

  try {
    const module = requireUncached(importPath);

    if(module && module[uiNames.className]) {
      return module[uiNames.className];
    }
  } catch (e) {
    return {
      cody: `Failed to import page definition: ${importPath}`,
      type: CodyResponseType.Error,
      details: JSON.stringify(e)
    }
  }

  return {
    cody: `Failed to import page definition: ${importPath}`,
    type: CodyResponseType.Error,
    details: `Looks like either this is a new page or it was deleted?`
  }
}
