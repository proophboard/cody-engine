import {AnyRule, PropMapping} from "@app/shared/rule-engine/configuration";
import {UiSchema} from "@rjsf/utils";
import {ButtonConfig} from "@frontend/app/components/core/button/button-config";

export interface Action {
  type: "command" | "link" | "rules";
  description?: string;
  position: "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
  button: ButtonConfig;
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

