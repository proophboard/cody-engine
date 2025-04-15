import * as React from 'react';
import {ValueObjectRuntimeInfo} from "@event-engine/messaging/value-object";
import {
  Field,
  getUiOptions,
  RJSFSchema, UiSchema,
  Widget
} from "@rjsf/utils";
import {Box, Card, CardContent, useTheme} from "@mui/material";
import {useEffect, useRef, useState} from "react";
import {Form} from "@rjsf/mui";
import {widgets} from "@frontend/app/components/core/form/widgets";
import {fields} from "@frontend/app/components/core/form/fields";
import {resolveRefs, resolveUiSchema} from "@event-engine/messaging/resolve-refs";
import definitions from "@app/shared/types/definitions";
import {useUser} from "@frontend/hooks/use-user";
import {normalizeUiSchema} from "@frontend/util/schema/normalize-ui-schema";
import {getRjsfValidator} from "@frontend/util/rjsf-validator";
import {DeepReadonly} from "json-schema-to-ts/lib/types/type-utils/readonly";
import {JSONSchema7} from "json-schema";
import {playFQCNFromDefinitionId} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import ObjectFieldTemplate, {
} from "@frontend/app/components/core/form/templates/ObjectFieldTemplate";
import {usePageData} from "@frontend/hooks/use-page-data";
import {useParams} from "react-router-dom";
import {FormJexlContext} from "@frontend/app/components/core/form/types/form-jexl-context";
import {merge} from "lodash/fp";
import BottomActions from "@frontend/app/components/core/actions/BottomActions";
import {useGlobalStore} from "@frontend/hooks/use-global-store";
import {useTypes} from "@frontend/hooks/use-types";
import {useTranslation} from "react-i18next";
import {translateUiSchema} from "@frontend/util/schema/translate-ui-schema";
import {translateSchema} from "@frontend/util/schema/translate-schema";
import {useEnv} from "@frontend/hooks/use-env";
import {IChangeEvent} from "@rjsf/core";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import {Logger} from "@frontend/util/Logger";
import {registryIdToDataReference} from "@app/shared/utils/registry-id-to-data-reference";
import {ArrayFieldTemplate} from "@frontend/app/components/core/form/templates/ArrayFieldTemplate";

interface OwnProps {
  state?: any;
  description: ValueObjectRuntimeInfo;
  onValidationError?: () => void;
  onChange?: (newState: {[prop: string]: any}) => void;
  onSubmitted?: () => void;
  widgets?: {[name: string]: Widget};
  fields?: {[name: string]: Field};
  templates?: {[name: string]: React.FunctionComponent<any>};
  definitions?: {[id: string]: DeepReadonly<JSONSchema7>};
  hidden?: boolean;
}

type FormViewProps = OwnProps;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let isInitialized = false;

const FormView = (props: FormViewProps) => {
  const theme = useTheme();
  const formRef: any = useRef();
  const [formData, setFormData] = useState<{[prop: string]: any}>(props.state || {});
  const [schema, setSchema] = useState<JSONSchema7>({});
  const [uiSchema, setUiSchema] = useState<UiSchema>({});
  const [liveValidate, setLiveValidate] = useState(false);
  const [user,] = useUser();
  const [pageData, , addPageForm] = usePageData();
  const [types] = useTypes();
  const routeParams = useParams();
  const [globalStore] = useGlobalStore();
  const {t} = useTranslation();
  const env = useEnv();
  const [extraError, setExtraError] = useState<JSX.Element | undefined>();

  const jexlCtx: FormJexlContext = {
    user,
    page: pageData,
    data: formData || {},
    routeParams,
    store: globalStore,
  }

  const {desc} = props.description;

  const extraErrorId = () => {
    return desc.name + '.Form.ExtraError'.replaceAll('.', '_');
  }

  const refreshPageForm = () => {
    addPageForm(registryIdToDataReference(props.description.desc.name) + '/Form', {
      getData: () => formRef.current?.state.formData || {},
      useSchema: (newSchema) => {
        setSchema(
          resolveRefs(
            translateSchema(newSchema as any, `${props.description.desc.name}.schema`, t),
            props.definitions || definitions,
            false,
            (s, k) => translateSchema(s, k, t)
          ) as RJSFSchema
        );
      },
      validate: () => {
        if(formRef.current) {
          return formRef.current.validateForm();
        }

        return false;
      },
      markAsSubmitted: () => {
        setLiveValidate(false);
        setExtraError(undefined);
        if(props.onSubmitted) {
          props.onSubmitted();
        }
      },
      displayError: errorComponent => setExtraError(errorComponent)
    })
  }

  useEffect(() => {
    isInitialized = true;

    setSchema(resolveRefs(
      translateSchema(props.description.schema as any, `${props.description.desc.name}.schema`, t),
      props.definitions || definitions,
      false,
      (s, k) => translateSchema(s, k, t)
    ) as RJSFSchema);

    const resolvedUiSchema = resolveUiSchema(
      props.description.schema as any,
      types,
      (s, k) => translateUiSchema(s, k, t)
    );

    const mainUiSchema = props.description.uiSchema
      ? translateUiSchema(props.description.uiSchema, `${props.description.desc.name}.uiSchema`, t)
      : undefined;
    const mergedUiSchema: UiSchema = merge(resolvedUiSchema, mainUiSchema) as UiSchema;
    setUiSchema(mergedUiSchema);

    const initialFormData = props.state || {};

    console.log("Set form data", initialFormData);
    setFormData({...initialFormData});

    refreshPageForm();

    return () => {
      isInitialized = false;
    }
  }, [desc.name]);

  useEffect(() => {
    if(extraError) {
      const ele = document.getElementById(extraErrorId());

      if(ele) {
        ele.scrollIntoView({behavior: "smooth"})
      }
    }
  }, [extraError]);

  const normalizedUiSchema = normalizeUiSchema(uiSchema, jexlCtx, env);

  const userWidgets = props.widgets || {};
  const uiOptions = getUiOptions(normalizedUiSchema);

  const infoFQCN = playFQCNFromDefinitionId(schema['$id'] || '');
  const defaultService = infoFQCN.split(".").shift() || '';

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
        setFormData(change);
        refreshPageForm();

        if(props.onChange) {
          props.onChange(change);
        }
      }
    }, 300);

    if(isFirstUpdate || forceUpdate) {
      setFormData(change);
      refreshPageForm();

      if(props.onChange) {
        props.onChange(change);
      }
    }
  }

  const handleValidationError = (error: any) => {
    Logger.warn('Validation failed: ', error, 'current formData: ', formData);

    setLiveValidate(true);

    if(props.onValidationError) {
      props.onValidationError();
    }
  }

  const handleUpdateFormFromContext = (fD: {[prop: string]: any}) => {
    // fire after onChange
    window.setTimeout(() => {
      if(formRef.current) {
        coordinateChange({...formRef.current.state.formData, ...fD}, true);
      }
    }, 100);
  }

  if(props.hidden) {
    return <></>;
  }

  return <Box sx={theme.commandForm?.styleOverrides}>
    <Form
      schema={schema}
      validator={getRjsfValidator()}
      children={<></>}
      // @ts-ignore
      ref={formRef}
      formData={formData}
      formContext={{data: formData, updateForm: handleUpdateFormFromContext, defaultService, mode: "pageForm"}}
      uiSchema={normalizedUiSchema}
      liveValidate={liveValidate}
      showErrorList={false}
      onError={handleValidationError}
      onChange={handleChange}
      // default browser validation needs to be turned off, otherwise optional objects with required props don't work
      noHtml5Validate={true}
      templates={
        {
          ObjectFieldTemplate,
          ArrayFieldTemplate,
          ...props.templates
        }
      }
      widgets={
        {
          // LinkedRef: LinkedReferenceWidget,
          // TextareaWidget: TextareaWidget,
          // TextWidget: TextWidget,
          ...widgets,
          ...userWidgets
        }
      }
      fields={{
        ...fields,
        ...props.fields
      }}
    />
    {extraError && <Box sx={{paddingTop: `${theme.spacing(4)}`}} id={extraErrorId()}>{extraError}</Box>}
    <BottomActions sx={{padding:  `${theme.spacing(4)} 0`}} uiOptions={uiOptions} defaultService={defaultService} jexlCtx={jexlCtx} />
  </Box>;
};

export default FormView;
