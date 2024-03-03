import * as React from 'react';
import {PlayCommandRuntimeInfo} from "@cody-play/state/types";
import {useContext, useState} from "react";
import CommandButton from "@frontend/app/components/core/CommandButton";
import CommandDialog from "@frontend/app/components/core/CommandDialog";
import {CommandRuntimeInfo} from "@event-engine/messaging/command";
import {makeCommandFactory} from "@cody-play/infrastructure/commands/make-command-factory";
import {configStore} from "@cody-play/state/config-store";
import {UiSchema} from "@rjsf/utils";
import MdiIcon from "@cody-play/app/components/core/MdiIcon";
import {makeCommandMutationFn} from "@cody-play/infrastructure/commands/make-command-mutation-fn";
import {isAggregateCommandDescription} from "@event-engine/descriptions/descriptions";
import {useUser} from "@frontend/hooks/use-user";
import PlayExistingStateCommandDialog from "@cody-play/app/components/core/PlayExistingStateCommandDialog";

interface OwnProps {
  command: PlayCommandRuntimeInfo
}

type PlayCommandProps = OwnProps;

const PlayCommand = (props: PlayCommandProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  // @TODO: Refactor to only use root config object
  const {config: {commandHandlers, definitions, events, eventReducers, aggregates, types }} = useContext(configStore);
  const {config} = useContext(configStore);
  const [user,] = useUser();

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const runtimeInfo: CommandRuntimeInfo = {
    ...props.command,
    factory: makeCommandFactory(props.command, definitions),
  }

  const commandDesc = props.command.desc;

  if(!isAggregateCommandDescription(commandDesc)) {
    return (
      <>
        <CommandButton
          command={runtimeInfo}
          onClick={handleOpenDialog}
          {...{ startIcon: getButtonIcon(runtimeInfo.uiSchema) }}
        />
        <CommandDialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          commandDialogCommand={runtimeInfo}
          definitions={definitions}
        />
      </>
    );
  }

  const rules = commandHandlers[commandDesc.name];
  let incompleteCommandConfigError: string | undefined;

  if(!rules) {
    incompleteCommandConfigError = `Cannot handle command. No business rules defined. Please connect the command to an aggregate and define business rules in the Cody Wizard`;
  }

  const aggregate = aggregates[commandDesc.aggregateName];

  if(!aggregate) {
    incompleteCommandConfigError = `Cannot handle command. Aggregate "${commandDesc.aggregateName}" is unknown. Please run Cody for the Aggregate again.`;
  }

  const aggregateEventReducers = eventReducers[commandDesc.aggregateName];

  if(!aggregateEventReducers) {
    incompleteCommandConfigError = `Cannot handle command. No events found. Please connect the command with at least one event and pass the event to Cody.`
  }

  const stateInfo = types[aggregate.state];

  if(!stateInfo) {
    incompleteCommandConfigError = `Cannot handle command. The resulting Information "${aggregate.state}" is unknown. Please run Cody with the corresponding information card to register it.`;
  }

  const commandFn = makeCommandMutationFn(
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

  return (
    <>
      <CommandButton
        command={runtimeInfo}
        onClick={handleOpenDialog}
        {...{ startIcon: getButtonIcon(runtimeInfo.uiSchema) }}
      />
      {commandDesc.newAggregate && <CommandDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        commandDialogCommand={runtimeInfo}
        commandFn={incompleteCommandConfigError?  undefined : commandFn}
        incompleteCommandConfigError={incompleteCommandConfigError}
        definitions={definitions}
      />}
      {!commandDesc.newAggregate && <PlayExistingStateCommandDialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          commandDialogCommand={runtimeInfo}
          commandFn={incompleteCommandConfigError? undefined : commandFn}
          incompleteCommandConfigError={incompleteCommandConfigError}
          definitions={definitions}
          stateInfo={stateInfo}
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
