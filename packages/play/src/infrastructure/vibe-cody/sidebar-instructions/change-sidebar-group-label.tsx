import {Instruction} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {FormatText} from "mdi-material-ui";
import {CodyResponseType} from "@proophboard/cody-types";
import {isTopLevelPage, PageDefinition} from "@frontend/app/pages/page-definitions";
import {getGroup} from "@cody-play/infrastructure/vibe-cody/sidebar-instructions/move-sidebar-item";
import {PlayTopLevelPage} from "@cody-play/state/types";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import {getEditedContextFromConfig} from "@cody-play/state/config-store";
import {names} from "@event-engine/messaging/helpers";

const TEXT = "Change label to ";

export const ChangeSidebarGroupLabel: Instruction = {
  text: TEXT,
  icon: <FormatText />,
  isActive: context => context.focusedElement?.type === 'sidebarItemGroup',
  match: input => input.startsWith(TEXT),
  execute: async (input, ctx, dispatch, config) => {
    const label = input.replace(TEXT, '').trim();

    const {focusedElement} = ctx;

    if (!focusedElement) {
      return {
        cody: `Oh, something went wrong. I can't change the icon, because focused element is not a sidebar item group.`,
        details: `This looks like a software bug. Please contact the prooph board team.`,
        type: CodyResponseType.Error
      }
    }

    const groupName = focusedElement.name;

    const groupPages = Object.values(config.pages).filter(p  => isTopLevelPage(p as PageDefinition) && getGroup(p as PlayTopLevelPage)?.label === groupName) as PlayTopLevelPage[];

    groupPages.forEach(p => {
      const copy = cloneDeepJSON(p) as PlayTopLevelPage;
      const group = getGroup(copy);
      if (group) {
        group.label = label;
        copy.sidebar.group = group;

        dispatch({
          ctx: getEditedContextFromConfig(config),
          type: "ADD_PAGE",
          page: copy,
          name: copy.name,
        });

        ctx.setFocusedElement({
          id: `group-${names(group.label).fileName}`,
          name: group.label,
          type: 'sidebarItemGroup'
        })
      }
    })

    return {
      cody: `Changed the label.`
    }
  }
}
