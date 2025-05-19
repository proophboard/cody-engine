import {Instruction, InstructionProvider} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {
  Action,
  CommandAction,
  getActionButtonName,
  getActionId,
} from "@frontend/app/components/core/form/types/action";
import {PlayPageDefinition} from "@cody-play/state/types";
import {FocusedButton} from "@cody-play/state/focused-element";

export const FocusOnButtonProvider: InstructionProvider = {
  isActive: context => !context.focusedElement && context.page.pathname !== '/welcome',
  provide: (context, config) => {
    const page = context.page.handle.page;
    return getAllFocusableButtonsOnPage(context.page.handle.page, config).map(a => ({
      isActive: () => true,
      text: `Focus on the button ${getActionButtonName(a.action)}`,
      match: input => input.startsWith(`Focus on button ${getActionButtonName(a.action)}`),
      noInputNeeded: true,
      execute: async () => {
        context.setFocusedElement(a)

        return {
          cody: `Alright, what do you want to change?`
        }
      }
    }))
  }
}

const getAllFocusableButtonsOnPage = (page: PlayPageDefinition, config: CodyPlayConfig): FocusedButton[] => {
  return page.commands.map(c => {
    const action = typeof c === "string"
      ? {
        type: "command",
        command: c
      } as CommandAction
      : c;

    return {
      name: getActionButtonName(action),
      type: "button",
      id: getActionId(action),
      action: action,
      containerInfo: {
        name: page.name,
        type: "page"
      }
    }
  })
}
