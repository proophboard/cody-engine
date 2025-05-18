import {Instruction, InstructionProvider} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {setButtonProperty} from "@cody-play/infrastructure/vibe-cody/utils/set-button-property";
import {FocusedButton} from "@cody-play/state/focused-element";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";

const makeChangeButtonVariantInstruction = (variant: string): Instruction => {
  const TEXT = `Use the ${variant} variant for the button.`;

  return {
    text: TEXT,
    noInputNeeded: true,
    isActive: context => !!context.focusedElement && context.focusedElement.type === "button",
    match: input => input.startsWith(TEXT),
    execute: async (input, ctx, dispatch, config) => {
      const success = await setButtonProperty(
        ctx.focusedElement! as FocusedButton,
        'variant',
        variant,
        config,
        dispatch
      )

      if (playIsCodyError(success)) {
        return success;
      }

      return {
        cody: `Button variant is changed.`
      }
    }
  }
}

export const ChangeButtonVariantProvider: InstructionProvider = {
  isActive: context => !!context.focusedElement && context.focusedElement.type === "button",
  provide: () => {
    return ['outlined', 'contained', 'text'].map(makeChangeButtonVariantInstruction)
  }
}

