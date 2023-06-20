import {PageDefinition, SubLevelPage, TopLevelPage} from "@frontend/app/pages/page-definitions";
import {Node} from "@proophboard/cody-types";
import {names} from "@event-engine/messaging/helpers";
import {staticLabel} from "@frontend/util/breadcrumb/static-label";
import {SquareRoundedOutline} from "mdi-material-ui";

export const makeDefaultPageDefinition = (ui: Node, topLevel: boolean): PageDefinition | TopLevelPage | SubLevelPage => {
  const def = {
    route: '/' + names(ui.getName()).fileName,
    commands: [],
    components: [],
    topLevel,
    breadcrumb: staticLabel(ui.getName()),
  }

  if(topLevel) {
    (def as Partial<TopLevelPage>).sidebar = {label: ui.getName(), Icon: SquareRoundedOutline}
  }

  if(!topLevel) {
    (def as Partial<SubLevelPage>).routeParams = [];
  }

  return def;
}
