import {AnyRule, PropMapping} from "@app/shared/rule-engine/configuration";
import {UiSchema} from "@rjsf/utils";
import {ButtonConfig} from "@frontend/app/components/core/button/button-config";
import {JSONSchema7} from "json-schema";
import {nodeLabel} from "@app/shared/utils/node-label";

export type ButtonPosition = "top-right" | "bottom-left" | "bottom-center" | "bottom-right";

export interface Action {
  type: "command" | "link" | "rules" | "form";
  description?: string;
  position: ButtonPosition;
}

export interface ButtonAction extends Action {
  button: ButtonConfig;
}

const ButtonActionTypes = [
  "command", "link", "rules",
]

export const getActionId = (action: Action): string => {
  if(isCommandAction(action)) {
    return action.command;
  }

  if(isLinkAction(action)) {
    if(action.href) {
      return action.href;
    }

    if(action.pageLink) {
      return typeof action.pageLink === "string" ? action.pageLink : action.pageLink.page;
    }
  }

  if(isFormAction(action)) {
    return action.name;
  }

  return JSON.stringify(action);
}

export const getActionName = (action: Action): string => {
  if(isCommandAction(action)) {
    return nodeLabel(action.command);
  }

  if(isLinkAction(action)) {
    if(action.href) {
      return `Link to ${(new URL(action.href).host)}`;
    }

    if(action.pageLink) {
      const pageName = typeof action.pageLink === "string" ? action.pageLink : action.pageLink.page;
      return `Page Link to ${nodeLabel(pageName)}`;
    }
  }

  if(isFormAction(action)) {
    return action.name;
  }

  return 'Rules Action';
}

export const getActionButtonName = (action: Action): string => {
  if(isButtonAction(action)) {
    return action.button?.label || (typeof action.button?.icon === "string" ? `${action.button?.icon} icon` : undefined)
      || getActionName(action);
  }

  return getActionName(action);
}

export const isButtonAction = (action: Action): action is ButtonAction => {
  return ButtonActionTypes.includes(action.type);
}

export const isLinkAction = (action: Action): action is LinkAction => {
  return action.type === "link";
}

export const isCommandAction = (action: Action): action is CommandAction => {
  return (!action.type && (action as any).command) || action.type === "command";
}

export const isRulesAction = (action: Action): action is RulesAction => {
  return action.type === "rules";
}

export const isFormAction = (action: Action): action is FormAction => {
  return action.type === "form";
}

export interface LinkAction extends ButtonAction {
  pageLink?: string | {page: string; mapping: Record<string, string>};
  href?: string;
}

export interface CommandAction extends ButtonAction {
  command: string;
  uiSchema?: UiSchema,
  connectTo?: string,
  directSubmit?: boolean,
  forceSchema?: boolean,
  data?: string | string[] | PropMapping | PropMapping[];
}

export interface RulesAction extends ButtonAction {
  rules: AnyRule[];
}

export type FormActionScope = 'page' | 'global';

export interface FormAction extends Action {
  name: string;
  schema: JSONSchema7,
  uiSchema?: UiSchema,
  scope?: FormActionScope
}

export type ActionConfig = LinkAction | CommandAction | RulesAction | FormAction;

export type TableActionConfig = (Omit<Omit<LinkAction, 'position'>, 'button'> | Omit<Omit<CommandAction, 'position'>, 'button'> | Omit<Omit<RulesAction, 'position'>, 'button'>) & {button: Partial<ButtonConfig>};

export type ActionContainerInfoType = 'page' | 'view' | 'command' | 'mixed';

export interface ActionContainerInfo {
  // Name can be a page name (type: page), information type name (type: view), command name (type: command)
  // or in case of "mixed" it is either an information type or command name, so both config registries have to be checked
  name: string;
  type: ActionContainerInfoType
}
