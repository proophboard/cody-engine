import {Instruction, InstructionProvider} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {setButtonProperty} from "@cody-play/infrastructure/vibe-cody/utils/set-button-property";
import {FocusedButton} from "@cody-play/state/focused-element";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {getLabelFromInstruction} from "@cody-play/infrastructure/vibe-cody/utils/text/get-label-from-instruction";
import { Cancel } from "mdi-material-ui";

const makeDisableButtonViaExpr = (): Instruction => {
  const TEXT = `Disable the button via expression`

  return {
    text: `${TEXT} "$> "`,
    label: TEXT,
    icon: <Cancel />,
    cursorPosition: {start: 38},
    isActive: () => true,
    match: input => input.startsWith(TEXT),
    execute: async (input, ctx, dispatch, config) => {
      const expr = getLabelFromInstruction(input, TEXT);

      const success = await setButtonProperty(
        ctx.focusedElement! as FocusedButton,
        'disabled:expr',
        expr,
        config,
        dispatch
      )

      if (playIsCodyError(success)) {
        return success;
      }

      return {
        cody: `Button is now disabled when the expression returns true.`
      }
    }
  }
}

export const DisableButtonProvider: InstructionProvider = {
  isActive: (context, config) => !!context.focusedElement && context.focusedElement.type === "button",
  provide: (context, config) => {
    return [
      makeDisableButtonViaExpr(),
    ]
  }
}
