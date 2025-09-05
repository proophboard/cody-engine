import {ValueObjectRuntimeInfo} from "@event-engine/messaging/value-object";
import {ViewRuntimeConfig} from "@frontend/app/components/core/views/view-runtime-config";
import {usePageData} from "@frontend/hooks/use-page-data";
import {determineQueryPayload} from "@app/shared/utils/determine-query-payload";
import {useUser} from "@frontend/hooks/use-user";
import {useGlobalStore} from "@frontend/hooks/use-global-store";
import {merge} from "lodash/fp";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {useEffect} from "react";
import {getInitialValuesFromUiSchema} from "@frontend/util/command-form/get-initial-values";
import {JSONSchema7} from "json-schema";
import {CircularProgress, useTheme} from "@mui/material";
import FormView from "@frontend/app/components/core/FormView";
import StateView from "@frontend/app/components/core/StateView";
import {useApiQuery} from "@frontend/queries/use-api-query";
import {QueryRuntimeInfo} from "@event-engine/messaging/query";
import {
  isQueryableDescription,
} from "@event-engine/descriptions/descriptions";
import {get} from "lodash";
import {normalizeUiSchema} from "@frontend/util/schema/normalize-ui-schema";
import {useEnv} from "@frontend/hooks/use-env";
import {registryIdToDataReference} from "@app/shared/utils/registry-id-to-data-reference";

export const makeStandardStateViewComponent = (information: ValueObjectRuntimeInfo, queryInfo: QueryRuntimeInfo) => {
  return (props: object & {hidden?: boolean}, config: ViewRuntimeConfig) => {
    const env = useEnv();
    const [page] = usePageData();
    const [user] = useUser();
    const [store] = useGlobalStore();
    const theme = useTheme();

    if (
      !isQueryableDescription(information.desc)
    ) {
      throw new Error(
        `Play state view can only be used to show queriable information, but "${information.desc.name}" is not of this information type.`
      );
    }

    const uiSchema = merge(
      information.uiSchema || {},
      config.uiSchemaOverride || {}
    );

    const [, addQueryResult] = usePageData();

    // Prepare the main query
    const queryParams = get(uiSchema, 'ui:query', props);

    const jexlQueryCtx = {
      theme,
      routeParams: props,
      user,
      page,
      store,
      data: {},
    };

    const query = useApiQuery(
      queryInfo.desc.name,
      determineQueryPayload(
        normalizeUiSchema(queryParams, jexlQueryCtx, env),
        queryInfo
      ),
      {},
      !config.loadState
    );


    const jexlCtx = {
      theme,
      routeParams: props,
      user,
      page,
      store,
      mode: config.pageMode === 'dialog' ? 'dialogView' : 'pageView',
    };

    let isHidden = config.isHiddenView;

    if (!isHidden && typeof uiSchema['ui:hidden'] !== 'undefined') {
      if (typeof uiSchema['ui:hidden'] === 'string') {
        isHidden = jexl.evalSync(uiSchema['ui:hidden'], jexlCtx);
        delete uiSchema['ui:hidden'];
      } else {
        isHidden = uiSchema['ui:hidden'];
      }
    }

    useEffect(() => {
      addQueryResult(registryIdToDataReference(information.desc.name), query);
    }, [query.dataUpdatedAt]);

    const initialValues =
      config.injectedInitialValues ||
      getInitialValuesFromUiSchema(
        uiSchema,
        information.schema as unknown as JSONSchema7,
        jexlCtx
      );
    const state = query.isSuccess
      ? merge(initialValues, query.data)
      : initialValues;

    if (isHidden) {
      return <></>;
    }

    if (query.isLoading) {
      return <CircularProgress />;
    }

    if (config.viewType === 'form') {
      return (
        <>
          {query.isSuccess && (
            <FormView
              pageMode={config.pageMode}
              description={{ ...information, uiSchema }}
              state={state}
              onSubmitted={() => (config.loadState ? query.refetch() : undefined)}
            />
          )}
        </>
      );
    } else {
      return (
        <>
          {query.isSuccess && (
            <StateView
              mode={config.pageMode === 'dialog' ? 'dialogView' : 'pageView'}
              description={{ ...information, uiSchema }}
              state={state}
            />
          )}
        </>
      );
    }
  }
}
