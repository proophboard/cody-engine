import {CodyPlayConfig} from "@cody-play/state/config-store";
import {PlayPageDefinition} from "@cody-play/state/types";
import {CodyResponse, CodyResponseType} from "@proophboard/cody-types";

export const findPageByRoute = (route: string, config: CodyPlayConfig): PlayPageDefinition | CodyResponse => {
  let page: PlayPageDefinition | undefined = Object.values(config.pages).find(p => p.route === route);

  if(!page) {
    return {
      cody: `Can't find a page with route "${route}" in the cody play configuration`,
      details: `This seems to be a bug. Please contact the prooph board team.`,
      type: CodyResponseType.Error
    }
  }

  return page;
}
