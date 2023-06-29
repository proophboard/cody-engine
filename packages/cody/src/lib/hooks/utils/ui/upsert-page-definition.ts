import {CodyResponse, CodyResponseType, Node} from "@proophboard/cody-types";
import {Context} from "../../context";
import {FsTree} from "nx/src/generators/tree";
import {List} from "immutable";
import {PageDefinition} from "@frontend/app/pages/page-definitions";
import {isDynamicBreadcrumb, UiMetadata} from "./get-ui-metadata";
import {updateProophBoardInfo} from "../prooph-board-info";
import {names} from "@event-engine/messaging/helpers";
import {detectService} from "../detect-service";
import {isCodyError} from "@proophboard/cody-utils";
import {generateFiles} from "@nx/devkit";
import {toJSON} from "../to-json";
import {getVoMetadata} from "../value-object/get-vo-metadata";
import {isQueryableStateDescription, isQueryableStateListDescription} from "@event-engine/descriptions/descriptions";
import {voFQCN} from "../value-object/definitions";
import {getVoFromSyncedNodes} from "../value-object/get-vo-from-synced-nodes";
import {convertRuleConfigToDynamicBreadcrumbValueGetterRules} from "../rule-engine/convert-rule-config-to-behavior";

export const upsertTopLevelPage = async (
  ui: Node,
  uiMeta: UiMetadata,
  ctx: Context,
  tree: FsTree,
  commands: List<Node>,
  viewModels: List<Node>,
  route: string,
  existingPageDefinition?: PageDefinition
): Promise<boolean|CodyResponse> => {
  const service = detectService(ui, ctx);

  if(isCodyError(service)) {
    return service;
  }

  const serviceNames = names(service);
  const uiNames = names(ui.getName());

  const pbInfo = updateProophBoardInfo(ui, ctx, tree);

  const commandNames = getCommandNames(commands, ctx, existingPageDefinition);

  if(isCodyError(commandNames)) {
    return commandNames;
  }

  const componentNames = getComponentNames(viewModels, ctx, existingPageDefinition);

  if(isCodyError(componentNames)) {
    return componentNames;
  }

  const breadcrumbInfo = getBreadcrumb(ui, uiMeta, ctx);

  if(isCodyError(breadcrumbInfo)) {
    return breadcrumbInfo;
  }

  const [breadcrumb, imports] = breadcrumbInfo;

  const sidebarIcon = uiMeta.sidebar?.icon || 'SquareRoundedOutline';

  imports.push(`import {${sidebarIcon}} from "mdi-material-ui"`)

  const sidebar = {
    label: uiMeta.sidebar?.label || uiNames.name,
    icon: sidebarIcon
  };

  generateFiles(tree, __dirname + '/../../ui-files/page-files/top-level', ctx.feSrc + '/app/pages', {
    ...pbInfo,
    tmpl: '',
    service: serviceNames.fileName,
    ...uiNames,
    route,
    sidebar,
    toJSON,
    breadcrumb,
    imports: imports.join(";\n"),
    commandNames,
    componentNames,
  })

  return true;
}

export const upsertSubLevelPage = async (
  ui: Node,
  uiMeta: UiMetadata,
  ctx: Context,
  tree: FsTree,
  commands: List<Node>,
  viewModels: List<Node>,
  route: string,
  routeParams: string[],
  existingPageDefinition?: PageDefinition
): Promise<boolean|CodyResponse> => {

  const service = detectService(ui, ctx);

  if(isCodyError(service)) {
    return service;
  }

  const serviceNames = names(service);
  const uiNames = names(ui.getName());

  const pbInfo = updateProophBoardInfo(ui, ctx, tree);

  const commandNames = getCommandNames(commands, ctx, existingPageDefinition);

  if(isCodyError(commandNames)) {
    return commandNames;
  }

  const componentNames = getComponentNames(viewModels, ctx, existingPageDefinition);

  if(isCodyError(componentNames)) {
    return componentNames;
  }

  const breadcrumbInfo = getBreadcrumb(ui, uiMeta, ctx);

  if(isCodyError(breadcrumbInfo)) {
    return breadcrumbInfo;
  }

  const [breadcrumb, breadcrumbImports] = breadcrumbInfo;

  generateFiles(tree, __dirname + '/../../ui-files/page-files/sub-level', ctx.feSrc + '/app/pages', {
    ...pbInfo,
    tmpl: '',
    service: serviceNames.fileName,
    ...uiNames,
    route,
    routeParams,
    toJSON,
    breadcrumb,
    breadcrumbImports: breadcrumbImports.join(";\n"),
    commandNames,
    componentNames,
  })

  return true;
}

const getCommandNames = (commands: List<Node>, ctx: Context, existingPageDefinition?: PageDefinition): string[] | CodyResponse => {
  const commandNames: string[] = existingPageDefinition?.commands || [];

  for (const command of commands) {
    const service = detectService(command, ctx);

    if(isCodyError(service)) {
      return service;
    }

    const cmdName = `${names(service).className}.${names(command.getName()).className}`;

    if(!commandNames.includes(cmdName)) {
      commandNames.push(cmdName);
    }
  }

  return commandNames;
}

const getComponentNames = (viewModels: List<Node>, ctx: Context, existingPageDefinition?: PageDefinition): string[] | CodyResponse => {
  const componentNames: string[] = existingPageDefinition?.components || [];

  for (const vo of viewModels) {
    const voMeta = getVoMetadata(vo, ctx);

    if(isCodyError(voMeta)) {
      return voMeta;
    }

    const service = detectService(vo, ctx);

    if(isCodyError(service)) {
      return service;
    }

    if(isQueryableStateDescription(voMeta) || isQueryableStateListDescription(voMeta)) {
      const componentName = `${names(service).className}.${names(vo.getName()).className}`;
      if(!componentNames.includes(componentName)) {
        componentNames.push(componentName);
      }
    }
  }

  return componentNames;
}

const getBreadcrumb = (ui: Node, uiMeta: UiMetadata, ctx: Context): [string, string[]] | CodyResponse => {
  const {breadcrumb} = uiMeta;
  const isDynamicLabel = isDynamicBreadcrumb(breadcrumb);

  if(!isDynamicLabel) {
    const label = uiMeta.breadcrumb || uiMeta.sidebar?.label || ui.getName();

    return [
      `staticLabel('${label}')`,
      ['import {staticLabel} from "@frontend/util/breadcrumb/static-label"']
    ]
  }

  const {data, label} = breadcrumb;

  const vo = getVOFromDataReference(data, ui, ctx);

  if(isCodyError(vo)) {
    return vo;
  }

  const voNames = names(vo.getName());
  const service = detectService(vo, ctx);

  if(isCodyError(service)) {
    return service;
  }

  const serviceNames = names(service);

  const valueGetterRules = convertRuleConfigToDynamicBreadcrumbValueGetterRules(ui, ctx, label, '    ');

  const valueGetter = `(data) => {
    const ctx: any = { data, value: '' };
    
    ${valueGetterRules}
    
    return ctx.value;
  }`;


  return [
    `dynamicLabel(Get${voNames.className}Desc.name, get${voNames.className}, ${valueGetter}, "${ui.getName()}")`,
    [
      'import {dynamicLabel} from "@frontend/util/breadcrumb/dynamic-label"',
      `import {Get${voNames.className}Desc} from "@app/shared/queries/${serviceNames.fileName}/get-${voNames.fileName}.desc"`,
      `import {get${voNames.className}} from "@frontend/queries/${serviceNames.fileName}/use-get-${voNames.fileName}"`,
      'import * as jexl from "jexl"'
    ]
  ]
}

const getVOFromDataReference = (data: string, ui: Node, ctx: Context): Node | CodyResponse => {
  data = data.replace(".", "/");

  if(data[0] === "/") {
    data = data.slice(1);
  }

  const parts = data.split("/");

  if(parts.length < 3) {
    const service = detectService(ui, ctx);

    if(isCodyError(service)) {
      return service;
    }

    const serviceClassName = names(service).className;
    const firstPart = names(parts[0]).className;

    if(firstPart !== serviceClassName) {
      parts.unshift(serviceClassName);
    }
  }

  data = parts.map(p => names(p).className).join(".");

  return getVoFromSyncedNodes(data, ctx);
}
