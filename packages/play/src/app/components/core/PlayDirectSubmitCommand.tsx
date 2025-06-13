import * as React from 'react';
import {PlayCommandRuntimeInfo, PlayInformationRuntimeInfo} from "@cody-play/state/types";
import CommandButton, {CommandButtonProps, commandTitle} from "@frontend/app/components/core/CommandButton";
import {useContext, useEffect, useState} from "react";
import {configStore} from "@cody-play/state/config-store";
import {useUser} from "@frontend/hooks/use-user";
import {useNavigate, useParams} from "react-router-dom";
import {usePageData} from "@frontend/hooks/use-page-data";
import {useGlobalStore} from "@frontend/hooks/use-global-store";
import {CommandRuntimeInfo} from "@event-engine/messaging/command";
import {makeCommandFactory} from "@cody-play/infrastructure/commands/make-command-factory";
import {CommandMutationFunction} from "@cody-play/infrastructure/commands/command-mutation-function";
import {isAggregateCommandDescription} from "@event-engine/descriptions/descriptions";
import {makeAggregateCommandMutationFn} from "@cody-play/infrastructure/commands/make-aggregate-command-mutation-fn";
import {makePureCommandMutationFn} from "@cody-play/infrastructure/commands/make-pure-command-mutation-fn";
import {Alert} from "@mui/material";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {UiSchema} from "@rjsf/utils";
import {merge} from "lodash/fp";
import {useSnackbar} from "notistack";
import {useTranslation} from "react-i18next";
import {getFormSuccessRedirect} from "@frontend/util/command-form/get-form-success-redirect";
import {FormJexlContext} from "@frontend/app/components/core/form/types/form-jexl-context";
import {useEnv} from "@frontend/hooks/use-env";

interface OwnProps {
  command: PlayCommandRuntimeInfo,
  buttonProps?: Partial<CommandButtonProps>,
  data: {[prop: string]: unknown},
  uiSchemaOverride?: UiSchema,
}

type PlayDirectSubmitCommandProps = OwnProps;

const PlayDirectSubmitCommand = (props: PlayDirectSubmitCommandProps) => {
  const env = useEnv();
  const {config} = useContext(configStore);
  const [user,] = useUser();
  const routeParams = useParams();
  const [page,] = usePageData();
  const [store] = useGlobalStore();
  const [incompleteCommandConfigError, setIncompleteCommandConfigError] = useState<string|undefined>();
  const snackbar = useSnackbar();
  const {t} = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const uiSchema = merge(props.command.uiSchema, props.uiSchemaOverride);

  const runtimeInfo: CommandRuntimeInfo = {
    ...props.command,
    uiSchema,
    factory: makeCommandFactory(props.command, config.definitions),
  }

  const commandDesc = props.command.desc;

  let commandFn: CommandMutationFunction | undefined = undefined;
  let stateInfo: PlayInformationRuntimeInfo | undefined = undefined;

  const rules = config.commandHandlers[commandDesc.name];

  if(!rules) {
    setIncompleteCommandConfigError(`Cannot handle command. No business rules defined. Please connect the command to an aggregate and define business rules in the Cody Wizard`)
  }

  /** Aggregate Command **/
  if(isAggregateCommandDescription(commandDesc)) {
    const aggregate = config.aggregates[commandDesc.aggregateName];

    if(!aggregate) {
      setIncompleteCommandConfigError(`Cannot handle command. Aggregate "${commandDesc.aggregateName}" is unknown. Please run Cody for the Aggregate again.`)
    }

    const aggregateEventReducers = config.eventReducers[commandDesc.aggregateName];

    if(!aggregateEventReducers) {
      setIncompleteCommandConfigError(`Cannot handle command. No events found. Please connect the command with at least one event and pass the event to Cody.`)
    }

    stateInfo = config.types[aggregate.state];

    if(!stateInfo) {
      setIncompleteCommandConfigError(`Cannot handle command. The resulting Information "${aggregate.state}" is unknown. Please run Cody with the corresponding information card to register it.`)
    }

    commandFn = makeAggregateCommandMutationFn(
      props.command,
      rules,
      aggregate,
      config.events,
      aggregateEventReducers,
      stateInfo,
      user,
      config.definitions,
      config
    )
  } else {
    /** Non-Aggregate Command */
    commandFn = makePureCommandMutationFn(
      props.command,
      rules,
      config.events,
      user,
      config.definitions,
      config
    );
  }

  const mutation = useMutation({
    mutationKey: [props.command.desc.name],
    mutationFn: commandFn,
  });

  useEffect(() => {
    mutation.reset();
  }, [props.command.desc.name]);

  const handleSubmit = () => {
    mutation.mutate(props.data);
  }

  useEffect(() => {
    mutation.reset();

    if(mutation.isError) {
      console.error(mutation.error);
      snackbar.enqueueSnackbar(commandTitle(runtimeInfo, t) + ' Failed. Check browser console for details', {variant: "error"})
      return;
    }

    if(mutation.isSuccess) {
      snackbar.enqueueSnackbar(commandTitle(runtimeInfo, t) + ' was successful', {variant: "success"});

      const redirect = getFormSuccessRedirect(runtimeInfo, {
        user,
        page,
        store,
        routeParams,
        data: props.data,
        mode: "commandDialogForm"
      } as FormJexlContext, env.DEFAULT_SERVICE, env.PAGES);

      if (
        (!isAggregateCommandDescription(runtimeInfo.desc) ||
          !runtimeInfo.desc.deleteState)
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
    command={runtimeInfo}
    onClick={handleSubmit}
    {...props.buttonProps}
  />
};

export default PlayDirectSubmitCommand;
