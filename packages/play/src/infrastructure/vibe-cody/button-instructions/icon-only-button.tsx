import {Instruction} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {PlusCircleOutline} from "mdi-material-ui";
import {FocusedButton} from "@cody-play/state/focused-element";
import {setButtonProperty} from "@cody-play/infrastructure/vibe-cody/utils/set-button-property";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";

const TEXT = "Convert to a icon-only button";

export const IconOnlyButton: Instruction = {
  text: TEXT,
  icon: <PlusCircleOutline />,
  noInputNeeded: true,
  match: input =>   input === TEXT,
  isActive: context => {
    if(!context.focusedElement || context.focusedElement.type !== "button") {
      return false;
    }

    const focusedButton = context.focusedElement as FocusedButton;

    return !!focusedButton.action.button?.label;
  },
  execute: async (input, ctx, dispatch, config) => {
    const success = await setButtonProperty(
      ctx.focusedElement! as FocusedButton,
      'label',
      undefined,
      config,
      dispatch
    );

    if(playIsCodyError(success)) {
      return success;
    }

    return {
      cody: `Ìt's now an icon-only button.`
    }
  }
}
