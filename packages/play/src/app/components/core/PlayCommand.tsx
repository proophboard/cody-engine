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
import {CONTACT_PB_TEAM} from "@cody-play/infrastructure/error/message";
import {useUser} from "@frontend/hooks/use-user";

interface OwnProps {
  command: PlayCommandRuntimeInfo
}

type PlayCommandProps = OwnProps;

const PlayCommand = (props: PlayCommandProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const {config: {commandHandlers, definitions, events, eventReducers, aggregates, types }} = useContext(configStore);
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
    throw new Error(`Only aggregate commands are supported at the moment. ${CONTACT_PB_TEAM}`);
  }

  const rules = commandHandlers[commandDesc.name];

  if(!rules) {
    throw new Error(`Cannot handle command. No business rules defined. Please connect the command to an aggregate and define business rules in the Cody Wizard`);
  }

  const aggregate = aggregates[commandDesc.aggregateName];

  if(!aggregate) {
    throw new Error(`Cannot handle command. Aggregate "${commandDesc.aggregateName}" is unknown.`);
  }

  const aggregateEventReducers = eventReducers[commandDesc.aggregateName];

  if(!aggregateEventReducers) {
    throw new Error(`Cannot handle command. No event reducers found. Please connect the command to an aggregate with at least one event. Use the Cody Wizard to define reducer rules for events.`);
  }

  const stateInfo = types[aggregate.state];

  if(!stateInfo) {
    throw new Error(`Cannot handle command. The resulting Information "${aggregate.state}" is unknown. Please run Cody with the corresponding information card to register it.`);
  }

  const commandFn = makeCommandMutationFn(
    props.command,
    rules,
    aggregate,
    events,
    aggregateEventReducers,
    stateInfo,
    user,
    definitions
  )

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
        commandFn={commandFn}
      />
    </>
  );
};

export default PlayCommand;

const getButtonIcon = (uiSchema: UiSchema | undefined): React.ReactNode | undefined => {
  if(uiSchema && uiSchema['ui:button'] && uiSchema['ui:button']['icon']) {
    return <MdiIcon icon={uiSchema['ui:button']['icon']} />
  }
}
