import {ValueObjectRuntimeInfo} from "@event-engine/messaging/value-object";
import {ViewRuntimeConfig} from "@frontend/app/components/core/views/view-runtime-config";
import {usePageData} from "@frontend/hooks/use-page-data";
import {useUser} from "@frontend/hooks/use-user";
import {useGlobalStore} from "@frontend/hooks/use-global-store";
import {merge} from "lodash/fp";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {getInitialValuesFromUiSchema} from "@frontend/util/command-form/get-initial-values";
import {JSONSchema7} from "json-schema";
import {useTheme} from "@mui/material";
import FormView from "@frontend/app/components/core/FormView";
import StateView from "@frontend/app/components/core/StateView";

export const makeStaticStateViewComponent = (information: ValueObjectRuntimeInfo) => {
  return (props: object & {hidden?: boolean}, config: ViewRuntimeConfig) => {
    const [page] = usePageData();
    const [user] = useUser();
    const [store] = useGlobalStore();
    const theme = useTheme();

    const uiSchema = merge(
      information.uiSchema || {},
      config.uiSchemaOverride || {}
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


    const initialValues =
      config.injectedInitialValues ||
      getInitialValuesFromUiSchema(
        uiSchema,
        information.schema as unknown as JSONSchema7,
        jexlCtx
      );

    if (isHidden) {
      return <></>;
    }

    if (config.viewType === 'form') {
      return (
        <FormView
          pageMode={config.pageMode}
          description={{ ...information, uiSchema }}
          state={initialValues}
        />
      );
    } else {
      return (
        <StateView
          mode={config.pageMode === 'dialog' ? 'dialogView' : 'pageView'}
          description={{ ...information, uiSchema }}
          state={initialValues}
        />
      );
    }
  }
}
