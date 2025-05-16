import {Instruction} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {CodyResponse} from "@proophboard/cody-types";
import {names} from "@event-engine/messaging/helpers";
import {PlayTopLevelPage} from "@cody-play/state/types";
import {getEditedContextFromConfig} from "@cody-play/state/config-store";
import {VibeCodyContext} from "@cody-play/infrastructure/vibe-cody/VibeCodyContext";

const TEXT = "Add a page called ";

export const AddAPageWithName: Instruction = {
  text: TEXT,
  isActive: context => true,
  match: input => input.startsWith(TEXT),
  execute: async (input: string, ctx: VibeCodyContext, dispatch, config, navigateTo): Promise<CodyResponse> => {
    const pageName = input.replace(TEXT, "").trim();
    const pageFQCN = `${names(config.defaultService).className}.${names(pageName).className}`;
    const newPageRoute = `/${names(pageName).fileName}`;

    const page:PlayTopLevelPage = {
      name: pageFQCN,
      service: config.defaultService,
      route: newPageRoute,
      commands: [],
      components: [],
      topLevel: true,
      sidebar: {
        label: pageName,
        icon: 'square',
        position: 5
      },
      breadcrumb: pageName,
    };

    dispatch({
      ctx: getEditedContextFromConfig(config),
      type: "ADD_PAGE",
      page,
      name: pageFQCN
    });

    navigateTo(newPageRoute);

    return {
      cody: `I've added a new empty page "${pageName}" and redirected you to it. What do you want to see on the page?`
    }
  }
}
