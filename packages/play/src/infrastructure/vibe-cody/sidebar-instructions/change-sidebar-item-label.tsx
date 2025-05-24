import {Instruction} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {isFocusedSidebarItem} from "@cody-play/state/focused-element";
import {CodyResponseType} from "@proophboard/cody-types";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import {PlayTopLevelPage} from "@cody-play/state/types";
import {getEditedContextFromConfig} from "@cody-play/state/config-store";
import {FormatText} from "mdi-material-ui";

const TEXT = "Change label to ";

export const ChangeSidebarItemLabel: Instruction = {
  text: TEXT,
  icon: <FormatText />,
  isActive: context => context.focusedElement?.type === "sidebarItem",
  match: input => input.startsWith(TEXT),
  execute: async (input, ctx, dispatch, config) => {
    const label = input.replace(TEXT, '').trim();

    const {focusedElement} = ctx;

    if(!focusedElement || !isFocusedSidebarItem(focusedElement)) {
      return {
        cody: `Oh, something went wrong. I can't change the label, because focused element is not a sidebar item`,
        details: `This looks like a software bug. Please contact the prooph board team.`,
        type: CodyResponseType.Error
      }
    }

    const page = config.pages[focusedElement.pageName];

    if(!page) {
      return {
        cody: `Oh, something went wrong. The focused sidebar item should be configured for page ${focusedElement.pageName}, but I can't find the page in teh cody play config`,
        details: `This looks like a bug in the software. Please contact the prooph board team.`,
        type: CodyResponseType.Error
      }
    }

    const pageCopy = cloneDeepJSON(page) as PlayTopLevelPage;

    pageCopy.sidebar.label = label;

    dispatch({
      ctx: getEditedContextFromConfig(config),
      type: "ADD_PAGE",
      page: pageCopy,
      name: focusedElement.pageName,
    });

    return {
      cody: `The label is changed.`
    }
  }
}
