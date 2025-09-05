import {CommandRuntimeInfo} from "@event-engine/messaging/command";
import CommandButton, {WithCommandButtonProps} from "@frontend/app/components/core/CommandButton";
import {useState} from "react";
import {useUser} from "@frontend/hooks/use-user";
import {useParams} from "react-router-dom";
import {usePageData} from "@frontend/hooks/use-page-data";
import {useGlobalStore} from "@frontend/hooks/use-global-store";
import {merge} from "lodash/fp";
import {getInitialValues} from "@frontend/util/command-form/get-initial-values";
import DirectCommandButton from "@frontend/app/components/core/DirectCommandButton";
import ConnectedCommandButton from "@frontend/app/components/core/ConnectedCommandButton";
import CommandDialog from "@frontend/app/components/core/CommandDialog";
import * as React from "react";
import {AxiosResponse} from "axios";
import {Api} from "@frontend/api";

interface OwnProps {
  initialValues?: { [prop: string]: unknown };
  onDialogOpen?: () => void;
  onDialogClose?: () => void;
}

type StandardCommandProps = OwnProps & WithCommandButtonProps;

export const makeStandardCommandComponent = (command: CommandRuntimeInfo) => {

  const triggerCommand = (params: any): Promise<AxiosResponse> => {
    return Api.executeCommand(command.desc.name, params);
  }

  return (props: StandardCommandProps) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [user] = useUser();
    const routeParams = useParams();
    const [page] = usePageData();
    const [store] = useGlobalStore();

    const uiSchema = merge(command.uiSchema, props.uiSchemaOverride);

    const modifiedRuntimeInfo = {
      ...command,
      uiSchema,
    };

    const handleOpenDialog = () => {
      setDialogOpen(true);
      if (props.onDialogOpen) {
        props.onDialogOpen();
      }
    };
    const handleCloseDialog = () => {
      setDialogOpen(false);
      if (props.onDialogClose) {
        props.onDialogClose();
      }
    };

    const initialValues =
      props.initialValues ||
      getInitialValues(modifiedRuntimeInfo, { user, routeParams, page, store });

    if (props.directSubmit) {
      return (
        <DirectCommandButton
          command={modifiedRuntimeInfo}
          commandFn={triggerCommand}
          data={initialValues || {}}
          buttonProps={props.buttonProps}
        />
      );
    }

    if (props.connectTo) {
      return (
        <ConnectedCommandButton
          command={modifiedRuntimeInfo}
          commandFn={triggerCommand}
          connectTo={props.connectTo}
          forceSchema={props.forceSchema}
          buttonProps={props.buttonProps}
        />
      );
    }

    return (
      <>
        <CommandButton
          command={modifiedRuntimeInfo}
          onClick={handleOpenDialog}
          { ...props.buttonProps }
        />
        <CommandDialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          commandDialogCommand={modifiedRuntimeInfo}
          commandFn={triggerCommand}
          initialValues={initialValues}
        />
      </>
    );
  }
}
