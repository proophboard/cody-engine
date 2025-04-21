import {Instruction} from "@cody-play/app/components/core/cody-gpt/CodyGPTDrawer";
import {CodyResponse} from "@proophboard/cody-types";
import {names} from "@event-engine/messaging/helpers";
import {PlayTopLevelPage} from "@cody-play/state/types";
import {getEditedContextFromConfig} from "@cody-play/state/config-store";
import {CodyGPTContext} from "@cody-play/infrastructure/cody-gpt/CodyGPTContext";

const TEXT = "Add a page called ";

export const AddAPageWithName: Instruction = {
  text: TEXT,
  isActive: context => true,
  match: input => input.startsWith(TEXT),
  execute: async (input: string, ctx: CodyGPTContext, dispatch, config, navigateTo): Promise<CodyResponse> => {
    const pageName = input.replace(TEXT, "").trim();
    const newPageRoute = `/${names(pageName).fileName}`;

    const page:PlayTopLevelPage = {
      name: pageName,
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
      name: pageName
    });

    navigateTo(newPageRoute);

    return {
      cody: `I've added a new empty page "${pageName}" and redirected you to it. What do you want to see on the page?`
    }
  }
}
