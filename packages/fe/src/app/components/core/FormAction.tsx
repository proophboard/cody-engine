import * as React from 'react';
import {FormAction as FormActionType} from "@frontend/app/components/core/form/types/action";
import {FormJexlContext} from "@frontend/app/components/core/form/types/form-jexl-context";
import {TableRowJexlContext} from "@frontend/app/components/core/table/table-row-jexl-context";
import {useEnv} from "@frontend/hooks/use-env";
import {getRjsfValidator} from "@frontend/util/rjsf-validator";
import {ArrayFieldTemplate} from "@frontend/app/components/core/form/templates/ArrayFieldTemplate";
import DescriptionFieldTemplate from "@frontend/app/components/core/form/templates/DescriptionFieldTemplate";
import {WidgetRegistry, widgets} from "@frontend/app/components/core/form/widgets";
import {fields} from "@frontend/app/components/core/form/fields";
import {Form} from "@rjsf/mui";
import ObjectFieldTemplate from "@frontend/app/components/core/form/templates/ObjectFieldTemplate";
import {Box, useTheme} from "@mui/material";
import {
  getInitialValuesFromUiSchemaForFormAction
} from "@frontend/util/command-form/get-initial-values";
import {useEffect, useRef} from "react";
import {usePageData} from "@frontend/hooks/use-page-data";
import {useGlobalStore} from "@frontend/hooks/use-global-store";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {IChangeEvent} from "@rjsf/core";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import PlayDataSelectWidget from "@cody-play/app/form/widgets/PlayDataSelectWidget";
import {useTranslation} from "react-i18next";
import {normalizeUiSchema} from "@frontend/util/schema/normalize-ui-schema";
import {translateUiSchema} from "@frontend/util/schema/translate-ui-schema";

interface OwnProps {
  action: FormActionType;
  defaultService: string;
  jexlCtx: FormJexlContext | TableRowJexlContext;
}

type FormActionProps = OwnProps;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let isInitialized = false;

const FormAction = ({action, defaultService, jexlCtx}: FormActionProps) => {
  const env = useEnv();
  const theme = useTheme();
  const formRef: any = useRef();
  const [pageData, setPageData] = usePageData();
  const [store, setStore, setGlobalStoreKey] = useGlobalStore();
  const {t} = useTranslation();

  const initialData = getInitialValuesFromUiSchemaForFormAction(action.uiSchema || {}, action.schema, jexlCtx);

  const scope = action.scope || 'page';
  const scopeAccess = scope === "page" ? 'page|data' : 'store|get';
  const storeName = `/FormAction/${action.name}`;

  const data = jexl.evalSync(`$> ${scopeAccess}('${storeName}', initialData)`, {page: pageData, store, initialData});

  const updateStore = (dataToStore: unknown): void => {
    if(scope === "page") {
      setPageData(storeName, dataToStore);
    } else {
      setGlobalStoreKey(storeName, dataToStore)
    }
  }

  useEffect(() => {
    const storedData = jexl.evalSync(`$> ${scopeAccess}('${storeName}', undefined)`, {page: pageData, store});

    if(typeof storedData !== "undefined" && scope === "global") {
      return;
    }

    if(JSON.stringify(storedData) !== JSON.stringify(initialData)) {
      updateStore(initialData);
    }

    isInitialized = true;
  }, [JSON.stringify(initialData)]);


  const handleUpdateFormFromContext = (fD: {[prop: string]: any}) => {
    updateStore(fD);
  }

  const handleChange = (e: IChangeEvent<any>) => {
    if(formRef.current) {
      coordinateChange(cloneDeepJSON(formRef.current.state.formData));
    }
  }

  const coordinateChange = (change: {[prop: string]: any}, forceUpdate = false) => {
    if(!isInitialized) {
      return;
    }

    let isFirstUpdate = true;

    if(debounceTimer) {
      clearTimeout(debounceTimer);
      isFirstUpdate = false;
    }

    debounceTimer = setTimeout(() => {
      if(formRef && !isFirstUpdate && !forceUpdate) {
        debounceTimer = null;
        updateStore(change);
      }
    }, 300);

    if(isFirstUpdate || forceUpdate) {
      updateStore(change);
    }
  }

  const uiSchema = translateUiSchema(normalizeUiSchema(action.uiSchema || {}, {
    ...jexlCtx,
    theme
  } as FormJexlContext, env), `${action.name}.uiSchema`, t);

  const playWidgets: WidgetRegistry = env.UI_ENV === "play" ? {
    DataSelect: PlayDataSelectWidget
  } : {};

  return <Box sx={theme.formAction.styleOverrides} className="CodyAction-root">
    <Form
      // @ts-ignore
      ref={formRef}
      schema={action.schema}
      validator={getRjsfValidator()}
      children={<></>}
      formData={data}
      onChange={handleChange}
      liveValidate={true}
      // default browser validation needs to be turned off, otherwise optional objects with required props don't work
      noHtml5Validate={true}
      showErrorList={false}
      formContext={{
        data: data,
        defaultService,
        mode: "pageForm",
        updateForm: handleUpdateFormFromContext,
        showDropzone: false
      }}
      uiSchema={uiSchema}
      className="CodyFormAction-root"
      templates={
        {
          ObjectFieldTemplate,
          ArrayFieldTemplate,
          DescriptionFieldTemplate,
        }
      }
      widgets={
        {
          // LinkedRef: LinkedReferenceWidget,
          // TextareaWidget: TextareaWidget,
          // TextWidget: TextWidget,
          ...widgets,
          ...playWidgets
        }
      }
      fields={{
        ...fields,
      }}
    />
  </Box>
};

export default FormAction;
