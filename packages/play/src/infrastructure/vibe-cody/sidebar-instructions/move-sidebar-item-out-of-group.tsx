import {Instruction} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {isFocusedSidebarItem} from "@cody-play/state/focused-element";
import {PlayTopLevelPage} from "@cody-play/state/types";
import { Ungroup } from "mdi-material-ui";
import {CodyResponseType} from "@proophboard/cody-types";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import {getEditedContextFromConfig} from "@cody-play/state/config-store";

const TEXT = `Move item out of sidebar group`;

export const MoveSidebarItemOutOfGroup: Instruction = {
  text: TEXT,
  icon: <Ungroup />,
  noInputNeeded: true,
  isActive: (context, config) => {
    const ele = context.focusedElement;
    if(!ele || !isFocusedSidebarItem(ele)) {
      return false;
    }

    const page = config.pages[ele.pageName] as PlayTopLevelPage;

    return !!page.sidebar.group;
  },
  match: input => input.startsWith(TEXT),
  execute: async (input, ctx, dispatch, config) => {
    const {focusedElement} = ctx;

    if(!focusedElement || !isFocusedSidebarItem(focusedElement)) {
      return {
        cody: `Oh, something went wrong. I can't change the icon, because focused element is not a sidebar item`,
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

    delete pageCopy.sidebar.group;

    dispatch({
      ctx: getEditedContextFromConfig(config),
      type: "ADD_PAGE",
      page: pageCopy,
      name: focusedElement.pageName,
    });

    return {
      cody: `Moved the item out of the group.`
    }
  }
}
