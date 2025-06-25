import * as React from 'react';
import CommandButton, {commandTitle, WithCommandButtonProps} from "@frontend/app/components/core/CommandButton";
import {CommandRuntimeInfo} from "@event-engine/messaging/command";
import {UseMutateAsyncFunction, useMutation, useQueryClient} from "@tanstack/react-query";
import {AxiosResponse} from "axios";
import {useEnv} from "@frontend/hooks/use-env";
import {useUser} from "@frontend/hooks/use-user";
import {useNavigate, useParams} from "react-router-dom";
import {usePageData} from "@frontend/hooks/use-page-data";
import {useGlobalStore} from "@frontend/hooks/use-global-store";
import {useEffect, useState} from "react";
import {useSnackbar} from "notistack";
import {useTranslation} from "react-i18next";
import {getFormSuccessRedirect} from "@frontend/util/command-form/get-form-success-redirect";
import {FormJexlContext} from "@frontend/app/components/core/form/types/form-jexl-context";
import {isAggregateCommandDescription} from "@event-engine/descriptions/descriptions";
import {Alert} from "@mui/material";

interface OwnProps {
  command: CommandRuntimeInfo;
  commandFn: UseMutateAsyncFunction<AxiosResponse, unknown, any>;
  data: {[prop: string]: unknown};
}

type DirectCommandButtonProps = OwnProps & WithCommandButtonProps;

const DirectCommandButton = (props: DirectCommandButtonProps) => {
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
  const [submittedData, setSubmittedData] = useState<{[prop: string]: unknown}>({});

  const mutation = useMutation({
    mutationKey: [props.command.desc.name],
    mutationFn: props.commandFn
  });

  useEffect(() => {
    mutation.reset();
  }, [props.command.desc.name]);

  const handleSubmit = () => {
    setSubmittedData(props.data);
    mutation.mutate(props.data);
  }

  useEffect(() => {
    mutation.reset();

    if(mutation.isError) {
      console.error(mutation.error);
      snackbar.enqueueSnackbar(commandTitle(props.command, t) + ' Failed. Check browser console for details', {variant: "error"})
      return;
    }

    if(mutation.isSuccess) {
      snackbar.enqueueSnackbar(commandTitle(props.command, t) + ' was successful', {variant: "success"});

      const redirect = getFormSuccessRedirect(props.command, {
        user,
        page,
        store,
        routeParams,
        data: submittedData,
        mode: 'commandDialogForm'
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

    return () => {
      setSubmittedData({});
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

export default DirectCommandButton;
