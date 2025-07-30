import {Instruction, InstructionProvider} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {FocusedButton, FocusedElement, isFocusedButton} from "@cody-play/state/focused-element";
import {CommandAction, isCommandAction} from "@frontend/app/components/core/form/types/action";
import {getLabelFromInstruction} from "@cody-play/infrastructure/vibe-cody/utils/text/get-label-from-instruction";
import {playNodeLabel} from "@cody-play/infrastructure/cody/schema/play-definition-id";

const TEXT = `Automatically run the action when `;

const isCommandActionFocused = (focusedElement: FocusedElement | undefined): boolean => {
  if(!focusedElement) {
    return false;
  }

  if(isFocusedButton(focusedElement)) {
    return isCommandAction(focusedElement.action);
  }

  return false;
}

const getCommandAction = (focusedButton: FocusedButton): CommandAction => {
  return focusedButton.action as CommandAction;
}

export const RunActionOnEventProvider: InstructionProvider = {
  isActive: (context, config) => isCommandActionFocused(context.focusedElement),
  provide: (context, config) => {
    const action = getCommandAction(context.focusedElement! as FocusedButton);

    if(!context.searchStr.startsWith(TEXT)) {
      return [
        {
          text: TEXT,
          allowSubSuggestions: true,
          isActive: () => true,
          match: input => input.startsWith(TEXT),
          execute: async (input, ctx, dispatch, config1) => {
            const eventName = getLabelFromInstruction(input, TEXT);



            return {
              cody: `"${playNodeLabel(action.command)}" will now run automatically whenever an event of type "${eventName}" occurs.`,
              details: `The "Message Box" in the Play Backend dialog can be used to trigger events manually. This is useful for testing.\n\nIt's also recommended to keep an eye on the browser console. The Cody Play environment provides detailed logs, so that you can monitor and debug your process automations.`
            }
          }
        }
      ]
    }



    return [];
  }
}
