import * as React from 'react';
import CommandButton, {commandTitle, WithCommandButtonProps} from "@frontend/app/components/core/CommandButton";
import {CommandRuntimeInfo} from "@event-engine/messaging/command";
import {UseMutateAsyncFunction, useMutation, useQueryClient} from "@tanstack/react-query";
import {AxiosError, AxiosResponse} from "axios";
import {useEffect, useState} from "react";
import {isPageFormReference} from "@app/shared/types/core/page-data/page-data";
import {JSONSchema7} from "json-schema";
import {usePageData} from "@frontend/hooks/use-page-data";
import {Alert, AlertTitle, Container} from "@mui/material";
import AxiosResponseViewer from "@frontend/app/components/core/AxiosResponseViewer";
import {getFormSuccessRedirect} from "@frontend/util/command-form/get-form-success-redirect";
import {FormJexlContext} from "@frontend/app/components/core/form/types/form-jexl-context";
import {isAggregateCommandDescription} from "@event-engine/descriptions/descriptions";
import {useSnackbar} from "notistack";
import {useTranslation} from "react-i18next";
import {useEnv} from "@frontend/hooks/use-env";
import {useUser} from "@frontend/hooks/use-user";
import {useNavigate, useParams} from "react-router-dom";
import {useGlobalStore} from "@frontend/hooks/use-global-store";

interface OwnProps {
  command: CommandRuntimeInfo;
  commandFn: UseMutateAsyncFunction<AxiosResponse, unknown, any>;
  connectTo: string;
}

type ConnectedCommandButtonProps = OwnProps & WithCommandButtonProps;

const ConnectedCommandButton = (props: ConnectedCommandButtonProps) => {
  const env = useEnv();
  const [user,] = useUser();
  const routeParams = useParams();
  const [page,] = usePageData();
  const [store] = useGlobalStore();
  const [incompleteCommandConfigError, setIncompleteCommandConfigError] = useState<string|undefined>();
  const snackbar = useSnackbar();
  const {t} = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: [props.command.desc.name],
    mutationFn: props.commandFn
  });

  useEffect(() => {
    mutation.reset();
  }, [props.command.desc.name]);

  const handleSubmit = async () => {
    const form = page[props.connectTo];

    if(!isPageFormReference(form)) {
      setIncompleteCommandConfigError(`Cannot find the form "${props.connectTo}" on the page. Configure a view of type "form" on the same page as the command.`);
      return;
    }

    const submit = () => {
      if(form.validate()) {
        const data = form.getData();

        mutation.mutate(data);
      }
    }

    if(props.forceSchema) {
      form.useSchema(props.command.schema as unknown as JSONSchema7);
      // Wait a moment so that the form can apply the schema
      window.setTimeout(submit, 50);
    } else {
      submit();
    }
  }

  useEffect(() => {
    const form = page[props.connectTo];

    mutation.reset();

    if(!isPageFormReference(form)) {
      return;
    }

    if(mutation.isError) {
      form.displayError(<Container disableGutters={true}>
        <Alert severity={'error'}>
          <AlertTitle>{(mutation.error as Error).name || 'Error'}</AlertTitle>
          {(mutation.error as Error).message}
        </Alert>
        {(mutation.error as AxiosError).response && <AxiosResponseViewer response={(mutation.error as AxiosError).response as AxiosResponse}/>}
      </Container>);
      return;
    }

    if(mutation.isSuccess) {
      snackbar.enqueueSnackbar(commandTitle(props.command, t) + ' was successful', {variant: "success"});
      form.markAsSubmitted();

      const redirect = getFormSuccessRedirect(props.command, {
        user,
        page,
        store,
        routeParams,
        data: form.getData()
      } as FormJexlContext, env.DEFAULT_SERVICE, env.PAGES);

      if (
        (!isAggregateCommandDescription(props.command.desc) ||
          !props.command.desc.deleteState)
        && !redirect
      ) {
        queryClient.invalidateQueries();
      }
      window.setTimeout(() => {
        if(redirect) {
          navigate(redirect);
          return;
        }
      }, 10);
    }
  }, [mutation.isSuccess, mutation.isError])

  if(incompleteCommandConfigError) {
    return <Alert severity="error">{incompleteCommandConfigError}</Alert>
  }

  return <CommandButton
    command={props.command}
    onClick={handleSubmit}
    {...props.buttonProps}
  />
};

export default ConnectedCommandButton;
