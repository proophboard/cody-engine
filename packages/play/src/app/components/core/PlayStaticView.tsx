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
import {UiSchema} from "@rjsf/utils";
import {merge} from "lodash/fp";
import {PageMode} from "@cody-play/app/pages/PlayStandardPage";

const PlayStaticView = (params: any, informationInfo: PlayInformationRuntimeInfo, pageMode: PageMode, hiddenView = false, uiSchemaOverride?: UiSchema, injectedInitialValues?: any) => {
  const {config: {definitions}} = useContext(configStore);
  const [page] = usePageData();
  const [user] = useUser();
  const [store] = useGlobalStore();

  const jexlCtx = {routeParams: params, user, page, store};

  let isHidden = hiddenView;

  const uiSchema = merge({...informationInfo.uiSchema} || {}, uiSchemaOverride || {});

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

  const result = injectedInitialValues || exec({});

  return <StateView
    mode={pageMode === "dialog" ? "dialogView" : "pageView"}
    state={result}
    description={{...informationInfo, uiSchema, factory: makeInformationFactory(informationInfo.factory)}}
    definitions={definitions}
    widgets={{
      DataSelect: PlayDataSelectWidget
    }}
  />
}

export default PlayStaticView;
