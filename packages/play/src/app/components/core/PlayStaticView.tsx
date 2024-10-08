import {PlayInformationRuntimeInfo} from "@cody-play/state/types";
import StateView from "@frontend/app/components/core/StateView";
import {makeInformationFactory} from "@cody-play/infrastructure/information/make-information-factory";
import {useContext} from "react";
import {configStore} from "@cody-play/state/config-store";
import {usePageData} from "@frontend/hooks/use-page-data";
import PlayDataSelectWidget from "@cody-play/app/form/widgets/PlayDataSelectWidget";
import {useUser} from "@frontend/hooks/use-user";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {useGlobalStore} from "@frontend/hooks/use-global-store";

const PlayStaticView = (params: any, informationInfo: PlayInformationRuntimeInfo, hiddenView = false) => {
  const {config: {definitions}} = useContext(configStore);
  const [page] = usePageData();
  const [user] = useUser();
  const [store] = useGlobalStore();

  const jexlCtx = {routeParams: params, user, page, store};

  let isHidden = hiddenView;

  const uiSchema = {...informationInfo.uiSchema} || {};

  if(!hiddenView && typeof uiSchema['ui:hidden'] !== "undefined") {
    if(typeof uiSchema['ui:hidden'] === "string") {
      isHidden = jexl.evalSync(uiSchema['ui:hidden'], jexlCtx);
      delete uiSchema['ui:hidden'];
    } else {
      isHidden = uiSchema['ui:hidden'];
    }
  }

  if(isHidden) {
    return <></>
  }

  const exec = makeInformationFactory(informationInfo.factory);

  const result = exec({});

  return <StateView
    state={result}
    description={{...informationInfo, uiSchema, factory: makeInformationFactory(informationInfo.factory)}}
    definitions={definitions}
    widgets={{
      DataSelect: PlayDataSelectWidget
    }}
  />
}

export default PlayStaticView;
