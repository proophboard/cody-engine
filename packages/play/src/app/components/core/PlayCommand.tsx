import * as React from 'react';
import {PlayCommandRuntimeInfo, PlayInformationRuntimeInfo} from "@cody-play/state/types";
import {useContext, useState} from "react";
import CommandButton, {CommandButtonProps} from "@frontend/app/components/core/CommandButton";
import CommandDialog from "@frontend/app/components/core/CommandDialog";
import {CommandRuntimeInfo} from "@event-engine/messaging/command";
import {makeCommandFactory} from "@cody-play/infrastructure/commands/make-command-factory";
import {configStore} from "@cody-play/state/config-store";
import {UiSchema} from "@rjsf/utils";
import MdiIcon from "@cody-play/app/components/core/MdiIcon";
import {makeAggregateCommandMutationFn} from "@cody-play/infrastructure/commands/make-aggregate-command-mutation-fn";
import {isAggregateCommandDescription} from "@event-engine/descriptions/descriptions";
import {useUser} from "@frontend/hooks/use-user";
import PlayExistingStateCommandDialog from "@cody-play/app/components/core/PlayExistingStateCommandDialog";
import PlayDataSelectWidget from "@cody-play/app/form/widgets/PlayDataSelectWidget";
import {CommandMutationFunction} from "@cody-play/infrastructure/commands/command-mutation-function";
import {makePureCommandMutationFn} from "@cody-play/infrastructure/commands/make-pure-command-mutation-fn";
import {useParams} from "react-router-dom";
import {usePageData} from "@frontend/hooks/use-page-data";
import {getInitialValues} from "@frontend/util/command-form/get-initial-values";

interface OwnProps {
  command: PlayCommandRuntimeInfo,
  buttonProps?: Partial<CommandButtonProps>,
  initialValues?: {[prop: string]: unknown},
  onDialogOpen?: () => void;
  onDialogClose?: () => void;
}

type PlayCommandProps = OwnProps;

const PlayCommand = (props: PlayCommandProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  // @TODO: Refactor to only use root config object
  const {config: {commandHandlers, definitions, events, eventReducers, aggregates, types }} = useContext(configStore);
  const {config} = useContext(configStore);
  const [user,] = useUser();
  const routeParams = useParams();
  const [page,] = usePageData();

  const handleOpenDialog = () => {
    setDialogOpen(true);
    if(props.onDialogOpen) {
      props.onDialogOpen();
    }
  };
  const handleCloseDialog = () => {
    setDialogOpen(false);
    if(props.onDialogClose) {
      props.onDialogClose();
    }
  };

  const runtimeInfo: CommandRuntimeInfo = {
    ...props.command,
    factory: makeCommandFactory(props.command, definitions),
  }

  const commandDesc = props.command.desc;

  let incompleteCommandConfigError: string | undefined;
  let commandFn: CommandMutationFunction | undefined = undefined;
  let stateInfo: PlayInformationRuntimeInfo | undefined = undefined;

  const rules = commandHandlers[commandDesc.name];

  if(!rules) {
    incompleteCommandConfigError = `Cannot handle command. No business rules defined. Please connect the command to an aggregate and define business rules in the Cody Wizard`;
  }

  const initialValues = props.initialValues || getInitialValues(props.command as unknown as CommandRuntimeInfo, {user, page, routeParams});

  /** Aggregate Command **/
  if(isAggregateCommandDescription(commandDesc)) {
    const aggregate = aggregates[commandDesc.aggregateName];

    if(!aggregate) {
      incompleteCommandConfigError = `Cannot handle command. Aggregate "${commandDesc.aggregateName}" is unknown. Please run Cody for the Aggregate again.`;
    }

    const aggregateEventReducers = eventReducers[commandDesc.aggregateName];

    if(!aggregateEventReducers) {
      incompleteCommandConfigError = `Cannot handle command. No events found. Please connect the command with at least one event and pass the event to Cody.`
    }

    stateInfo = types[aggregate.state];

    if(!stateInfo) {
      incompleteCommandConfigError = `Cannot handle command. The resulting Information "${aggregate.state}" is unknown. Please run Cody with the corresponding information card to register it.`;
    }

    commandFn = makeAggregateCommandMutationFn(
      props.command,
      rules,
      aggregate,
      events,
      aggregateEventReducers,
      stateInfo,
      user,
      definitions,
      config
    )
  } else {
    /** Non-Aggregate Command */
    commandFn = makePureCommandMutationFn(
      props.command,
      rules,
      events,
      user,
      definitions,
      config
    );
  }

  return (
    <>
      <CommandButton
        command={runtimeInfo}
        onClick={handleOpenDialog}
        {...{ startIcon: getButtonIcon(runtimeInfo.uiSchema), ...props.buttonProps }}
      />
      {((isAggregateCommandDescription(commandDesc) && commandDesc.newAggregate) || !isAggregateCommandDescription(commandDesc) ) && <CommandDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        commandDialogCommand={runtimeInfo}
        commandFn={incompleteCommandConfigError?  undefined : commandFn}
        incompleteCommandConfigError={incompleteCommandConfigError}
        definitions={definitions}
        initialValues={initialValues}
        widgets={{
          DataSelect: PlayDataSelectWidget
        }}
      />}
      {stateInfo && isAggregateCommandDescription(commandDesc) && !commandDesc.newAggregate && <PlayExistingStateCommandDialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          commandDialogCommand={runtimeInfo}
          commandFn={incompleteCommandConfigError? undefined : commandFn}
          incompleteCommandConfigError={incompleteCommandConfigError}
          definitions={definitions}
          stateInfo={stateInfo}
          initialValues={initialValues}
      />}
    </>
  );
};

export default PlayCommand;

const getButtonIcon = (uiSchema: UiSchema | undefined): React.ReactNode | undefined => {
  if(uiSchema && uiSchema['ui:button'] && uiSchema['ui:button']['icon']) {
    return <MdiIcon icon={uiSchema['ui:button']['icon']} />
  }
}
