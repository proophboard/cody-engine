import {PlayPageDefinition} from "@cody-play/state/types";
import {CodyPlayConfig} from "@cody-play/state/config-store";

export const getRedirectAfterDeletePage = (page: PlayPageDefinition, config: CodyPlayConfig): PlayPageDefinition => {
  const parts = page.route.split("/");

  parts.pop();

  const parentRoute = parts.join("/");

  const pages = Object.values(config.pages);

  for (const p of pages) {
    if(p.route === parentRoute) {
      return p
    }
  }

  return page;
}
