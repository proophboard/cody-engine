import {Instruction, InstructionProvider} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {setButtonProperty} from "@cody-play/infrastructure/vibe-cody/utils/set-button-property";
import {FocusedButton} from "@cody-play/state/focused-element";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import Circle from "mdi-material-ui/Circle";

const makeChangeButtonColorInstruction = (color: string): Instruction => {
  const TEXT = `Set button color to ${color}.`;

  return {
    text: TEXT,
    noInputNeeded: true,
    icon: <Circle color={color as any} />,
    isActive: context => !!context.focusedElement && context.focusedElement.type === "button",
    match: input => input.startsWith(TEXT),
    execute: async (input, ctx, dispatch, config) => {
      const success = await setButtonProperty(
        ctx.focusedElement! as FocusedButton,
        'color',
        color,
        config,
        dispatch
      )

      if (playIsCodyError(success)) {
        return success;
      }

      return {
        cody: `Changed the button color.`
      }
    }
  }
}

export const ChangeButtonColorProvider: InstructionProvider = {
  isActive: context => !!context.focusedElement && context.focusedElement.type === "button",
  provide: () => {
    return ['primary', 'secondary', 'info', 'success', 'warning', 'error'].map(makeChangeButtonColorInstruction)
  }
}
