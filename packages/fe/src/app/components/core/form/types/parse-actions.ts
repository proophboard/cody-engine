import {FormJexlContext} from "@frontend/app/components/core/form/types/form-jexl-context";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import {determineButtonConfig} from "@frontend/app/components/core/button/determine-button-config";
import {Action, isButtonAction} from "@frontend/app/components/core/form/types/action";
import {CommandComponent} from "@cody-engine/cody/hooks/utils/ui/types";
import {TFunction} from "i18next";
import {RuntimeEnvironment} from "@frontend/app/providers/runtime-environment";

export const parseActionsFromUiOptions = (uiOptions: Record<string, any>, jexlCtx: FormJexlContext, env: RuntimeEnvironment): Action[] => {
  const actions: Action[] = [];

  if (uiOptions['actions'] && Array.isArray(uiOptions['actions'])) {
    for (const action of uiOptions['actions']) {
      const actionCopy = cloneDeepJSON(action);
      if (!actionCopy.type || !["command", "link", "rules"].includes(actionCopy.type)) {
        actionCopy.type = "link";
      }

      if (!actionCopy.position || !["top-right", "bottom-left", "bottom-center", "bottom-right"].includes(actionCopy.position)) {
        actionCopy.position = "top-right";
      }

      if (!actionCopy.button || typeof actionCopy.button !== "object") {
        actionCopy.button = determineButtonConfig({label: "change"}, {}, jexlCtx, env);
      } else {
        actionCopy.button = determineButtonConfig({}, {"ui:button": actionCopy.button}, jexlCtx, env)
      }

      if (actionCopy.type === "link") {
        if (!actionCopy.href && !actionCopy.pageLink) {
          actionCopy.href = "#";
        }
      }

      if (actionCopy.type === "command") {
        if (!actionCopy.command) {
          actionCopy.command = "Unknown"
        }
      }

      if (actionCopy.type === "rules") {
        if (!actionCopy.rules) {
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

    if (typeof c === "string") {
      return {
        type: "command",
        command: c,
        position: "bottom-left",
        button: determineButtonConfig({}, {}, jexlCtx, env)
      }
    } else {
      if(isButtonAction(c)) {
        return {
          ...c,
          type: c.type || "command",
          button: c.button || determineButtonConfig({}, {}, jexlCtx, env),
          position: c.position || "bottom-right",
        }
      }

      return {
        ...c,
        type: c.type || "form",
        position: c.position || "bottom-right",
      }
    }
  })
}
