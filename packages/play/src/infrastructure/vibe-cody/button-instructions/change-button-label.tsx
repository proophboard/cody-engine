import {Instruction} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {setButtonProperty} from "@cody-play/infrastructure/vibe-cody/utils/set-button-property";
import {FocusedButton} from "@cody-play/state/focused-element";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {FormatText} from "mdi-material-ui";
import {getLabelFromInstruction} from "@cody-play/infrastructure/vibe-cody/utils/text/get-label-from-instruction";

const TEXT = "Change label to ";

export const ChangeButtonLabel: Instruction = {
  text: TEXT,
  icon: <FormatText />,
  isActive: context => !!context.focusedElement && context.focusedElement.type === "button",
  match: input => input.startsWith(TEXT),
  execute: async (input, ctx, dispatch, config) => {
    const btnLabel = getLabelFromInstruction(input, TEXT);

    const success = await setButtonProperty(
      ctx.focusedElement! as FocusedButton,
      'label',
      btnLabel,
      config,
      dispatch
    )

    if(playIsCodyError(success)) {
      return success;
    }

    return {
      cody: `Button label is changed.`
    }
  }
}
