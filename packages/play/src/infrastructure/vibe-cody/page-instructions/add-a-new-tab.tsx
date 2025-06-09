import {Instruction} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import { TabPlus } from "mdi-material-ui";
import {VibeCodyContext} from "@cody-play/infrastructure/vibe-cody/VibeCodyContext";
import {CodyResponse} from "@proophboard/cody-types";
import {withNavigateToProcessing} from "@cody-play/infrastructure/vibe-cody/utils/navigate/with-navigate-to-processing";
import {names} from "@event-engine/messaging/helpers";
import {playNodeLabel, playServiceFromFQCN} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import {getRouteParamsFromRoute} from "@cody-play/infrastructure/vibe-cody/utils/navigate/get-route-params-from-route";
import {
  removeLastPartFromRouteIfStatic
} from "@cody-play/infrastructure/vibe-cody/utils/navigate/remove-last-part-from-route-if-static";
import {getEditedContextFromConfig} from "@cody-play/state/config-store";
import {PlaySubLevelPage} from "@cody-play/state/types";

const TEXT = `Add a new tab called `;

export const AddANewTab: Instruction = {
  text: TEXT,
  icon: <TabPlus />,
  isActive: context => !context.focusedElement && context.page.pathname !== '/welcome',
  match: input => input.startsWith(TEXT),
  execute: withNavigateToProcessing(async (input: string, ctx: VibeCodyContext, dispatch, config, navigateTo): Promise<CodyResponse> => {
    const pageConfig = ctx.page.handle.page;
    const tabLabel = input.replace(TEXT, "").trim();
    const tabNames = names(tabLabel);

    let tabGroup = '';
    let baseRoute = '';
    let basePath = '';
    const routeParams = getRouteParamsFromRoute(pageConfig.route);
    const service = playServiceFromFQCN(pageConfig.name);

    const pageNames = names(playNodeLabel(pageConfig.name));

    if(!pageConfig.tab) {
      tabGroup = pageNames.fileName;
      baseRoute = pageConfig.route;
      basePath = ctx.page.pathname;

      dispatch({
        ctx: getEditedContextFromConfig(config),
        type: "ADD_PAGE",
        page: {
          ...pageConfig,
          route: `${baseRoute}/${pageNames.fileName}`,
          tab: {
            group: tabGroup,
            label: playNodeLabel(pageConfig.name)
          }
        },
        name: pageConfig.name
      });
    } else {
      tabGroup = pageConfig.tab.group;
      baseRoute = removeLastPartFromRouteIfStatic(pageConfig.route);
      basePath = removeLastPartFromRouteIfStatic(ctx.page.pathname);
    }

    const page:PlaySubLevelPage = {
      name: `${service}.${tabNames.className}`,
      service: service,
      route: `${baseRoute}/${tabNames.fileName}`,
      commands: [],
      components: [],
      topLevel: false,
      breadcrumb: playNodeLabel(tabLabel),
      routeParams: routeParams,
      tab: {
        group: tabGroup,
        label: playNodeLabel(tabLabel)
      }
    };

    dispatch({
      ctx: getEditedContextFromConfig(config),
      type: "ADD_PAGE",
      page,
      name: page.name
    });

    navigateTo(`${basePath}/${tabNames.fileName}`);

    return {
      cody: `Added a new tab.`,
    }
  }, true)
}
