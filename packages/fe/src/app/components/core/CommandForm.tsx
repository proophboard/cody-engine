import * as React from 'react';
import {CommandRuntimeInfo} from "@event-engine/messaging/command";
import {
  ArrayFieldTemplateProps,
  Field,
  FieldTemplateProps,
  ObjectFieldTemplateProps,
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
import {Alert, AlertTitle, Container} from "@mui/material";
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

interface OwnProps {
  command: CommandRuntimeInfo;
  commandFn?: UseMutateAsyncFunction;
  definitions: {[id: string]: DeepReadonly<JSONSchema7>};
  onBeforeSubmitting?: (formData: {[prop: string]: any}) => {[prop: string]: any};
  onSubmitted?: () => void;
  onResponseReceived?: () => void;
  onBackendErrorReceived?: () => void;
  onValidationError?: () => void;
  onChange?: () => void;
  formData?: {[prop: string]: any};
  objectFieldTemplate?: React.FunctionComponent<ObjectFieldTemplateProps>;
  arrayFieldTemplate?: React.FunctionComponent<ArrayFieldTemplateProps>;
  fieldTemplate?: React.FunctionComponent<FieldTemplateProps>;
  widgets?: {[name: string]: Widget};
  fields?: {[name: string]: Field};
  tryAgain?: boolean;
}

type CommandFormProps = OwnProps;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const CommandForm = (props: CommandFormProps, ref: any) => {
  let formRef: any = useRef();
  const [isInitialized, setInitialized] = useState(false);
  const [formData, setFormData] = useState<{[prop: string]: any}>({});
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
      setFormData(cloneDeepJSON(formRef.state.formData));
      formRef.submit();
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

    setFormData({...initialFormData});
    setInitialized(true);

    return () => {
      setInitialized(false);
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
      props.onResponseReceived();
    }
  }, [mutation.isSuccess, mutation.isError])

  const handleValidationError = (error: any) => {
    Logger.warn('Validation failed: ', error, 'current formData: ', formData);

    if(props.onValidationError) {
      props.onValidationError();
    }
  }

  const handleChange = (e: IChangeEvent<any>) => {
    if(!isInitialized) {
      return;
    }

    if(debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      if(formRef) {
        setFormData(cloneDeepJSON(formRef.state.formData));
      }
    }, 300);

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
    setTimeout(() => {
      if(formRef) {
        setFormData({...formRef.state.formData, ...fD});
      }
    }, 310) /* wait until debounce timer of onChange fired */
  }

  const {desc} = props.command;

  const userWidgets = props.widgets || {};

  const mainUiSchema = props.command.uiSchema ? props.command.uiSchema : undefined;
  const resolvedUiSchema = resolveUiSchema(props.command.schema as any, types);
  const uiSchema = normalizeUiSchema({...resolvedUiSchema, ...mainUiSchema}, {form: formData, user, page: pageData});

  const schema = resolveRefs(cloneSchema(props.command.schema as any), props.definitions) as RJSFSchema;

  return (
    <div>
      <Grid2 container={true} spacing={3}>
        <Grid2 md={12}>
          {!mutation.isSuccess && !mutation.isError && <Form
              schema={schema}
              children={<></>}
              // @ts-ignore
              ref={(form) => formRef = form}
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
                ...(props.objectFieldTemplate? {ObjectFieldTemplate: props.objectFieldTemplate} : {}),
                ...(props.arrayFieldTemplate? {ArrayFieldTemplate: props.arrayFieldTemplate} : {}),
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
              <AlertTitle>{commandTitle(props.command)} was successful</AlertTitle>
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
