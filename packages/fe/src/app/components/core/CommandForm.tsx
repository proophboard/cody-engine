import * as React from 'react';
import {CommandRuntimeInfo} from "@event-engine/messaging/command";
import {
  Field,
  RJSFSchema,
  Widget
} from "@rjsf/utils";
import {useEffect, useImperativeHandle, useRef, useState} from "react";
import {UseMutateAsyncFunction, useMutation} from "@tanstack/react-query";
import {Logger} from "@frontend/util/Logger";
import Form from "@rjsf/mui";
import {isAggregateCommandDescription} from "@event-engine/descriptions/descriptions";
import {v4} from "uuid";
import Grid2 from "@mui/material/Unstable_Grid2";
import {Alert, AlertTitle, Container, useTheme} from "@mui/material";
import AxiosResponseViewer from "@frontend/app/components/core/AxiosResponseViewer";
import {AxiosError, AxiosResponse} from "axios";
import {commandTitle} from "@frontend/app/components/core/CommandButton";
import {IChangeEvent} from "@rjsf/core";
import {widgets} from "@frontend/app/components/core/form/widgets";
import {fields} from "@frontend/app/components/core/form/fields";
import {cloneSchema, resolveRefs, resolveUiSchema} from "@event-engine/messaging/resolve-refs";
import {useUser} from "@frontend/hooks/use-user";
import {normalizeUiSchema} from "@frontend/util/schema/normalize-ui-schema";
import {types} from "@app/shared/types";
import {getRjsfValidator} from "@frontend/util/rjsf-validator";
import {DeepReadonly} from "json-schema-to-ts/lib/types/type-utils/readonly";
import {JSONSchema7} from "json-schema";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import {usePageData} from "@frontend/hooks/use-page-data";
import ObjectFieldTemplate from "@frontend/app/components/core/form/templates/ObjectFieldTemplate";
import {translateSchema} from "@frontend/util/schema/translate-schema";
import {useTranslation} from "react-i18next";
import {translateUiSchema} from "@frontend/util/schema/translate-ui-schema";

interface OwnProps {
  command: CommandRuntimeInfo;
  commandFn?: UseMutateAsyncFunction;
  definitions: {[id: string]: DeepReadonly<JSONSchema7>};
  onBeforeSubmitting?: (formData: {[prop: string]: any}) => {[prop: string]: any};
  onSubmitted?: () => void;
  onResponseReceived?: (formData: {[prop: string]: any}) => void;
  onBackendErrorReceived?: () => void;
  onValidationError?: () => void;
  onChange?: () => void;
  formData?: {[prop: string]: any};
  templates?: {[name: string]: React.FunctionComponent<any>};
  widgets?: {[name: string]: Widget};
  fields?: {[name: string]: Field};
  tryAgain?: boolean;
}

type CommandFormProps = OwnProps;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let isInitialized = false;

const CommandForm = (props: CommandFormProps, ref: any) => {
  const theme = useTheme();
  const formRef: any = useRef();
  const {t} = useTranslation();
  const [formData, setFormData] = useState<{[prop: string]: any}>(props.formData || {});
  const [liveValidate, setLiveValidate] = useState(false);
  const [user,] = useUser();
  const [pageData,] = usePageData();
  const mutation = useMutation({
    mutationKey: [props.command.desc.name],
    mutationFn: props.commandFn,
  });

  useImperativeHandle(ref, () => ({
    submit: (): void => {
      setLiveValidate(true);
      setFormData(cloneDeepJSON(formRef.current.state.formData));
      formRef.current.submit();
    },
  }));

  useEffect(() => {
    mutation.reset();

    const initialFormData = props.formData || {};

    if(
      isAggregateCommandDescription(desc) && desc.newAggregate && desc.aggregateIdentifier
      && schema.properties && schema.properties[desc.aggregateIdentifier]
    ) {
      initialFormData[desc.aggregateIdentifier] = v4();
    }
    console.log("Set form data", initialFormData);
    setFormData({...initialFormData});
    isInitialized = true;

    return () => {
      isInitialized = false;
    }
  }, [props.command.desc.name]);

  useEffect(() => {
    if(props.tryAgain) {
      mutation.reset();
    }
  }, [props.tryAgain]);

  useEffect(() => {
    if(mutation.isError && props.onBackendErrorReceived) {
      props.onBackendErrorReceived();
      return;
    }

    if(mutation.isSuccess && props.onResponseReceived) {
      props.onResponseReceived(formData);
    }
  }, [mutation.isSuccess, mutation.isError])

  const handleValidationError = (error: any) => {
    Logger.warn('Validation failed: ', error, 'current formData: ', formData);

    if(props.onValidationError) {
      props.onValidationError();
    }
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

    console.log("coordinating change", isInitialized, forceUpdate, change);

    let isFirstUpdate = true;

    if(debounceTimer) {
      clearTimeout(debounceTimer);
      isFirstUpdate = false;
    }

    debounceTimer = setTimeout(() => {
      if(formRef && !isFirstUpdate && !forceUpdate) {
        debounceTimer = null;
        console.log("Set form data in debounce timer", change);
        setFormData(change);
      }
    }, 300);

    if(isFirstUpdate || forceUpdate) {
      console.log("set form data as first update", forceUpdate, change);
      setFormData(change);
    }

    if(props.onChange) {
      props.onChange();
    }
  }

  const handleSubmit = (e: IChangeEvent<any>) => {
    let unsubmittedFormData = cloneDeepJSON(e.formData);
    if(props.onBeforeSubmitting) {
      unsubmittedFormData = props.onBeforeSubmitting(unsubmittedFormData);
    }
    mutation.mutate(unsubmittedFormData);
    setLiveValidate(false);
    setFormData(unsubmittedFormData);
    if(props.onSubmitted) {
      props.onSubmitted();
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

  const {desc} = props.command;

  const userWidgets = props.widgets || {};

  const mainUiSchema = props.command.uiSchema
    ? translateUiSchema(props.command.uiSchema, `${props.command.desc.name}.uiSchema`, t)
    : undefined;
  const resolvedUiSchema = resolveUiSchema(props.command.schema as any, types, (s, k) => translateUiSchema(s, k, t));
  const uiSchema = normalizeUiSchema({...resolvedUiSchema, ...mainUiSchema}, {form: formData, user, page: pageData});

  const schema = resolveRefs(
    translateSchema(props.command.schema as JSONSchema7, `${props.command.desc.name}.schema`, t) as any,
    props.definitions,
    false,
    (s, k) => translateSchema(s, k, t)
  ) as RJSFSchema;

  console.log("current form data", formData);

  return (
    <div>
      <Grid2 container={true} spacing={3} sx={theme.commandForm?.styleOverrides}>
        <Grid2 md={12}>
          {!mutation.isSuccess && !mutation.isError && <Form
            schema={schema}
            children={<></>}
            // @ts-ignore
            ref={formRef}
            onSubmit={handleSubmit}
            formData={formData}
            formContext={{data: formData, updateForm: handleUpdateFormFromContext}}
            uiSchema={uiSchema}
            liveValidate={liveValidate}
            showErrorList={false}
            onError={handleValidationError}
            onChange={handleChange}
            validator={getRjsfValidator()}
            // default browser validation needs to be turned off, otherwise optional objects with required props don't work
            noHtml5Validate={true}
            templates={{
              ObjectFieldTemplate,
              ...props.templates,
            }}
            widgets={
              {
                ...widgets,
                ...userWidgets
              }
            }
            fields={
              {
                ...fields,
                ...props.fields
              }
            }
          />}
          {(mutation.isSuccess || mutation.isError) && <div>
            {mutation.isSuccess && <AxiosResponseViewer response={mutation.data as AxiosResponse} successMessageCreated={<Alert severity={'success'}>
              <AlertTitle>{commandTitle(props.command, t)} was successful</AlertTitle>
            </Alert>}/>}
            {mutation.isError && (
              <Container disableGutters={true}>
                <Alert severity={'error'}>
                  <AlertTitle>{(mutation.error as Error).name || 'Error'}</AlertTitle>
                  {(mutation.error as Error).message}
                </Alert>
                {(mutation.error as AxiosError).response && <AxiosResponseViewer response={(mutation.error as AxiosError).response as AxiosResponse}/>}
              </Container>
            )}
          </div>}
        </Grid2>
      </Grid2>
    </div>
  );
};

export default React.forwardRef(CommandForm);
