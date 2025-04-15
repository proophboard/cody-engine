import * as React from 'react';
import {PlayInformationRuntimeInfo} from "@cody-play/state/types";
import {useContext, useEffect} from "react";
import {configStore} from "@cody-play/state/config-store";
import {usePageData} from "@frontend/hooks/use-page-data";
import {useUser} from "@frontend/hooks/use-user";
import {useGlobalStore} from "@frontend/hooks/use-global-store";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {makeInformationFactory} from "@cody-play/infrastructure/information/make-information-factory";
import PlayDataSelectWidget from "@cody-play/app/form/widgets/PlayDataSelectWidget";
import FormView from "@frontend/app/components/core/FormView";
import {UiSchema} from "@rjsf/utils";
import {merge} from "lodash/fp";
import {getInitialValuesFromUiSchema} from "@frontend/util/command-form/get-initial-values";
import {JSONSchema7} from "json-schema";

const PlayNewStateFormView = (params: any, informationInfo: PlayInformationRuntimeInfo, hiddenView = false, uiSchemaOverride?: UiSchema, injectedInitialValues?: any) => {
  const {config: {definitions}} = useContext(configStore);
  const [page, addQueryResult] = usePageData();
  const desc = informationInfo.desc;
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

  const state = injectedInitialValues || getInitialValuesFromUiSchema(uiSchema, informationInfo.schema as unknown as JSONSchema7, jexlCtx);

  return <>
    <FormView
      state={state}
      description={{...informationInfo, uiSchema, factory: makeInformationFactory(informationInfo.factory)}}
      definitions={definitions}
      widgets={{
        DataSelect: PlayDataSelectWidget
      }}
    />
  </>
};

export default PlayNewStateFormView;
