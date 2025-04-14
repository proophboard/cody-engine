import {ButtonConfig, determineButtonConfig} from "@frontend/app/components/core/button/determine-button-config";
import {FormJexlContext} from "@frontend/app/components/core/form/types/form-jexl-context";
import {AnyRule, PropMapping} from "@app/shared/rule-engine/configuration";
import {CommandComponent} from "@cody-engine/cody/hooks/utils/ui/types";
import {UiSchema} from "@rjsf/utils";
import {TFunction} from "i18next";
import {commandTitle} from "@frontend/app/components/core/CommandButton";
import {translateSchema} from "@frontend/util/schema/translate-schema";
import {camelCaseToTitle} from "@frontend/util/string";
import {RuntimeEnvironment} from "@frontend/app/providers/UseEnvironment";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";

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
  forceSchema?: boolean,
  data?: string | string[] | PropMapping | PropMapping[];
}

export interface RulesAction extends Action {
  rules: AnyRule[];
}

export type ActionConfig = LinkAction | CommandAction | RulesAction;

export type TableActionConfig = (Omit<Omit<LinkAction, 'position'>, 'button'> | Omit<Omit<CommandAction, 'position'>, 'button'> | Omit<Omit<RulesAction, 'position'>, 'button'>) & {button: Partial<ButtonConfig>};

export const parseActionsFromUiOptions = (uiOptions: Record<string, any>, jexlCtx: FormJexlContext, env: RuntimeEnvironment): Action[] => {
  const actions: Action[] = [];

  if(uiOptions['actions'] && Array.isArray(uiOptions['actions'])) {
    for (const action of uiOptions['actions']) {
      const actionCopy = cloneDeepJSON(action);
      if(!actionCopy.type || !["command", "link", "rules"].includes(actionCopy.type)) {
        actionCopy.type = "link";
      }

      if(!actionCopy.position || !["top-right", "bottom-left", "bottom-center", "bottom-right"].includes(actionCopy.position)) {
        actionCopy.position = "top-right";
      }

      if(!actionCopy.button || typeof actionCopy.button !== "object") {
        actionCopy.button = determineButtonConfig({label: "change"}, {}, jexlCtx, env);
      } else {
        actionCopy.button = determineButtonConfig({}, {"ui:button": actionCopy.button}, jexlCtx, env)
      }

      if(actionCopy.type === "link") {
        if(!actionCopy.href && !actionCopy.pageLink) {
          actionCopy.href = "#";
        }
      }

      if(actionCopy.type === "command") {
        if(!actionCopy.command) {
          actionCopy.command = "Unknown"
        }
      }

      if(actionCopy.type === "rules") {
        if(!actionCopy.rules) {
          actionCopy.rules = [];
        }
      }

      actions.push(action as Action);
    }
  }

  return actions;
}

export const parseActionsFromPageCommands = (commands: CommandComponent[], jexlCtx: FormJexlContext, t: TFunction, env: RuntimeEnvironment): Action[] => {
  return commands.map(c => {

    if(typeof c === "string") {
      return {
        type: "command",
        command: c,
        position: "bottom-left",
        button: determineButtonConfig({}, {}, jexlCtx, env)
      }
    } else {
      return {
        ...c,
        type: c.type || "command",
        button: c.button || determineButtonConfig({}, {}, jexlCtx, env),
        position: c.position || "bottom-right",
      }
    }
  })
}
