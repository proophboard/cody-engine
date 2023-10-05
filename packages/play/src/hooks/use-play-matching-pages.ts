import {PlayPageDefinition} from "@cody-play/state/types";
import {compileRouteIfPossible} from "@frontend/util/routing/compile-route";
import {useContext} from "react";
import {configStore} from "@cody-play/state/config-store";
import {usePlayPageMatch} from "@cody-play/hooks/use-play-page-match";
import {PageDefinition} from "@frontend/app/pages/page-definitions";

export const usePlayMatchingPages = (): PlayPageDefinition[] => {
  const {handle: {page}, params, pathname} = usePlayPageMatch();
  const {config: {pages}} = useContext(configStore);

  return Object.values(pages).filter(p => {
    if(p === page) {
      return true;
    }
    const compiledRoute = compileRouteIfPossible(p as unknown as PageDefinition, params);

    if(!compiledRoute) {
      return false;
    }

    return pathname.includes(compiledRoute);
  }).sort((aPage, bPage) => {
    const aNestingLevel = aPage.route.split("/").length;
    const bNestingLevel = bPage.route.split("/").length;

    return aNestingLevel < bNestingLevel ? -1 : 1;
  })
}
