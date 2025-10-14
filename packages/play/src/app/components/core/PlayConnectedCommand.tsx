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
import {getButtonIcon} from "@cody-play/app/components/core/PlayCommand";
import {Alert, AlertTitle, Container} from "@mui/material";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {isPageFormReference} from "@app/shared/types/core/page-data/page-data";
import {JSONSchema7} from "json-schema";
import {UiSchema} from "@rjsf/utils";
import {merge} from "lodash/fp";
import {useSnackbar} from "notistack";
import {useTranslation} from "react-i18next";
import {AxiosError, AxiosResponse} from "axios";
import AxiosResponseViewer from "@frontend/app/components/core/AxiosResponseViewer";
import {getFormSuccessRedirect} from "@frontend/util/command-form/get-form-success-redirect";
import {FormJexlContext} from "@frontend/app/components/core/form/types/form-jexl-context";
import {useEnv} from "@frontend/hooks/use-env";

interface OwnProps {
  command: PlayCommandRuntimeInfo,
  connectTo: string,
  buttonProps?: Partial<CommandButtonProps>,
  forceSchema?: boolean,
  uiSchemaOverride?: UiSchema,
}

type PlayConnectedCommandProps = OwnProps;

const PlayConnectedCommand = (props: PlayConnectedCommandProps) => {
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

  const handleSubmit = async () => {
    const form = page[props.connectTo];

    if(!isPageFormReference(form)) {
      setIncompleteCommandConfigError(`Cannot find the form "${props.connectTo}" on the page. Configure a view of type "form" on the same page as the command.`);
      return;
    }

    const submit = async () => {
      if(await form.validate()) {
        const data = form.getData();

        mutation.mutate(data);
      }
    }

    if(props.forceSchema) {
      form.useSchema(props.command.schema as unknown as JSONSchema7);
      // Wait a moment so that the form can apply the schema
      window.setTimeout(submit, 50);
    } else {
      await submit();
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
      snackbar.enqueueSnackbar(commandTitle(runtimeInfo, t) + ' was successful', {variant: "success"});
      form.markAsSubmitted();

      const redirect = getFormSuccessRedirect(runtimeInfo, {
        user,
        page,
        store,
        routeParams,
        data: form.getData(),
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

export default PlayConnectedCommand;
