import {Instruction, InstructionProvider} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {setButtonProperty} from "@cody-play/infrastructure/vibe-cody/utils/set-button-property";
import {FocusedButton} from "@cody-play/state/focused-element";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {FormatText, SquareRounded, SquareRoundedOutline} from "mdi-material-ui";

type Variant = 'contained' | 'outlined' | 'text';

const variantIcon = (variant: Variant): React.ReactNode => {
  switch (variant) {
    case "contained":
      return <SquareRounded />
    case "outlined":
      return <SquareRoundedOutline />
    case "text":
      return <FormatText />
  }
}


const makeChangeButtonVariantInstruction = (variant: Variant): Instruction => {
  const TEXT = `Use the ${variant} variant for the button.`;

  return {
    text: TEXT,
    icon: variantIcon(variant),
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
    return (['outlined', 'contained', 'text'] as Variant[]).map(makeChangeButtonVariantInstruction)
  }
}

