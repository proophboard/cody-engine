import * as React from 'react';
import {PlayInformationRuntimeInfo} from "@cody-play/state/types";
import {useContext, useEffect, useMemo} from "react";
import {configStore} from "@cody-play/state/config-store";
import {usePageData} from "@frontend/hooks/use-page-data";
import {useUser} from "@frontend/hooks/use-user";
import {useGlobalStore} from "@frontend/hooks/use-global-store";
import {useApiQuery} from "@frontend/queries/use-api-query";
import {
  isQueryableNotStoredValueObjectDescription,
  isQueryableStateDescription,
  isQueryableValueObjectDescription,
  QueryableStateDescription
} from "@event-engine/descriptions/descriptions";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {registryIdToDataReference} from "@app/shared/utils/registry-id-to-data-reference";
import {Alert, CircularProgress} from "@mui/material";
import {makeInformationFactory} from "@cody-play/infrastructure/information/make-information-factory";
import PlayDataSelectWidget from "@cody-play/app/form/widgets/PlayDataSelectWidget";
import FormView from "@frontend/app/components/core/FormView";
import {UiSchema} from "@rjsf/utils";
import {merge} from "lodash/fp";
import {getInitialValuesFromUiSchema} from "@frontend/util/command-form/get-initial-values";
import {JSONSchema7} from "json-schema";

const PlayStateFormView = (params: any, informationInfo: PlayInformationRuntimeInfo, hiddenView = false, uiSchemaOverride?: UiSchema, injectedInitialValues?: any) => {
  const {config: {definitions}} = useContext(configStore);
  const [page, addQueryResult] = usePageData();
  const desc = informationInfo.desc;
  const [user] = useUser();
  const [store] = useGlobalStore();

  const jexlCtx = {routeParams: params, user, page, store};

  const query = useApiQuery((desc as QueryableStateDescription).query, params);

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

  useEffect(() => {
    addQueryResult(registryIdToDataReference(desc.name), query);
  }, [params, query.dataUpdatedAt]);

  if(!isQueryableStateDescription(desc) && !isQueryableValueObjectDescription(desc) && !isQueryableNotStoredValueObjectDescription(desc)) {
    return <Alert severity="error" >Unable to render view. Referenced Information "{informationInfo.desc.name}" is not queryable and cannot be loaded from the database. You have to define a query schema and resolve configuration in the Cody Wizard.</Alert>
  }

  const initialValues = injectedInitialValues || getInitialValuesFromUiSchema(uiSchema, informationInfo.schema as unknown as JSONSchema7, jexlCtx);
  const state = query.isSuccess ? merge(initialValues, query.data) : initialValues;

  if(isHidden) {
    return <></>
  }

  return <>
    {query.isLoading && <CircularProgress />}
    {query.isSuccess && <FormView
      state={state}
      description={{...informationInfo, uiSchema, factory: makeInformationFactory(informationInfo.factory)}}
      definitions={definitions}
      widgets={{
        DataSelect: PlayDataSelectWidget
      }}
      onSubmitted={() => query.refetch()}
    />
    }
  </>
};

export default PlayStateFormView;
