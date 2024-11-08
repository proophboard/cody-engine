import {ButtonConfig, determineButtonConfig} from "@frontend/app/components/core/button/determine-button-config";
import {FormJexlContext} from "@frontend/app/components/core/form/types/form-jexl-context";
import {AnyRule, PropMapping} from "@app/shared/rule-engine/configuration";

export interface Action {
  type: "command" | "link" | "rules";
  position: "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
  button: ButtonConfig;
}

export const isLinkAction = (action: Action): action is LinkAction => {
  return action.type === "link";
}

export const isCommandAction = (action: Action): action is CommandAction => {
  return action.type === "command";
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
  data?: string | string[] | PropMapping | PropMapping[];
}

export interface RulesAction extends Action {
  rules: AnyRule[];
}

export type ActionConfig = LinkAction | CommandAction | RulesAction;

export type TableActionConfig = (Omit<Omit<LinkAction, 'position'>, 'button'> | Omit<Omit<CommandAction, 'position'>, 'button'> | Omit<Omit<RulesAction, 'position'>, 'button'>) & {button: Partial<ButtonConfig>};

export const parseActionsFromUiOptions = (uiOptions: Record<string, any>, jexlCtx: FormJexlContext): Action[] => {
  const actions: Action[] = [];

  if(uiOptions['actions'] && Array.isArray(uiOptions['actions'])) {
    for (const action of uiOptions['actions']) {
      if(!action.type || !["command", "link", "rules"].includes(action.type)) {
        action.type = "link";
      }

      if(!action.position || !["top-right", "bottom-left", "bottom-center", "bottom-right"].includes(action.position)) {
        action.position = "top-right";
      }

      if(!action.button || typeof action.button !== "object") {
        action.button = determineButtonConfig({label: "change"}, {}, jexlCtx);
      } else {
        action.button = determineButtonConfig({}, {"ui:button": action.button}, jexlCtx)
      }

      if(action.type === "link") {
        if(!action.href && !action.pageLink) {
          action.href = "#";
        }
      }

      if(action.type === "command") {
        if(!action.command) {
          action.command = "Unknown"
        }
      }

      if(action.type === "rules") {
        if(!action.rules) {
          action.rules = [];
        }
      }

      actions.push(action as Action);
    }
  }

  return actions;
}
