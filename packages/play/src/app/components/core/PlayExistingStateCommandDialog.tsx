import * as React from 'react';
import {CommandRuntimeInfo} from "@event-engine/messaging/command";
import {UseMutateAsyncFunction} from "@tanstack/react-query";
import {AxiosResponse} from "axios";
import {DeepReadonly} from "json-schema-to-ts/lib/types/type-utils/readonly";
import {JSONSchema7} from "json-schema";
import {PlayInformationRuntimeInfo} from "@cody-play/state/types";
import {useApiQuery} from "@frontend/queries/use-api-query";
import {QueryableStateDescription} from "@event-engine/descriptions/descriptions";
import {useParams} from "react-router-dom";
import CommandDialog from "@frontend/app/components/core/CommandDialog";

interface OwnProps {
  open: boolean;
  onClose: () => void;
  commandDialogCommand: CommandRuntimeInfo;
  commandFn?: UseMutateAsyncFunction<AxiosResponse, unknown, any>;
  incompleteCommandConfigError?: string;
  stateInfo: PlayInformationRuntimeInfo;
  definitions?: {[id: string]: DeepReadonly<JSONSchema7>};
}

type PlayExistingStateCommandDialogProps = OwnProps;

const PlayExistingStateCommandDialog = (props: PlayExistingStateCommandDialogProps) => {
  const params = useParams();
  const query = useApiQuery((props.stateInfo.desc as QueryableStateDescription).query, params);

  return <CommandDialog
    open={props.open}
    onClose={props.onClose}
    commandDialogCommand={props.commandDialogCommand}
    commandFn={props.commandFn}
    incompleteCommandConfigError={props.incompleteCommandConfigError}
    definitions={props.definitions}
    aggregateState={query.isSuccess ? query.data : {}}
    />
};

export default PlayExistingStateCommandDialog;
