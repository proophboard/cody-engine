import {AnyRule, PropMapping} from "@app/shared/rule-engine/configuration";
import {UiSchema} from "@rjsf/utils";
import {ButtonConfig} from "@frontend/app/components/core/button/button-config";
import {playNodeLabel} from "@cody-play/infrastructure/cody/schema/play-definition-id";

export type ButtonPosition = "top-right" | "bottom-left" | "bottom-center" | "bottom-right";

export interface Action {
  type: "command" | "link" | "rules";
  description?: string;
  position: ButtonPosition;
  button: ButtonConfig;
}

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

  return JSON.stringify(action);
}

export const getActionName = (action: Action): string => {
  if(isCommandAction(action)) {
    return playNodeLabel(action.command);
  }

  if(isLinkAction(action)) {
    if(action.href) {
      return `Link to ${(new URL(action.href).host)}`;
    }

    if(action.pageLink) {
      const pageName = typeof action.pageLink === "string" ? action.pageLink : action.pageLink.page;
      return `Page Link to ${playNodeLabel(pageName)}`;
    }
  }

  return 'Rules Action';
}

export const getActionButtonName = (action: Action): string => {
  return action.button?.label || (typeof action.button?.icon === "string" ? `${action.button?.icon} icon` : undefined)
    || getActionName(action);
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

export interface LinkAction extends Action {
  pageLink?: string | {page: string; mapping: Record<string, string>};
  href?: string;
}

export interface CommandAction extends Action {
  command: string;
  uiSchema?: UiSchema,
  connectTo?: string,
  directSubmit?: boolean,
  forceSchema?: boolean,
  data?: string | string[] | PropMapping | PropMapping[];
}

export interface RulesAction extends Action {
  rules: AnyRule[];
}

export type ActionConfig = LinkAction | CommandAction | RulesAction;

export type TableActionConfig = (Omit<Omit<LinkAction, 'position'>, 'button'> | Omit<Omit<CommandAction, 'position'>, 'button'> | Omit<Omit<RulesAction, 'position'>, 'button'>) & {button: Partial<ButtonConfig>};

export interface ActionContainerInfo {
  // Name can be a page name (type: page), information type name (type: view), command name (type: command)
  // or in case of "mixed" it is either an information type or command name, so both config registries have to be checked
  name: string;
  type: 'page' | 'view' | 'command' | 'mixed'
}
