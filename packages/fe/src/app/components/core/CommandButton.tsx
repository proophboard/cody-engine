import * as React from 'react';
import {CommandRuntimeInfo} from "@event-engine/messaging/command";
import {camelCaseToTitle} from "@frontend/util/string";
import {Button, SxProps} from "@mui/material";
import {isAggregateCommandDescription} from "@event-engine/descriptions/descriptions";
import {Plus} from "mdi-material-ui";

interface OwnProps {
  command: CommandRuntimeInfo;
  onClick: () => void;
  label?: string;
  startIcon?: React.ReactNode | undefined;
  buttonColor?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | undefined;
  style?: SxProps;
  disabled?: boolean;
  variant?: "text" | "outlined" | "contained"
}

export type CommandButtonProps = OwnProps;

export interface WithCommandButtonProps {
  buttonProps?: Partial<CommandButtonProps>
}

export const commandTitle = (cmd: CommandRuntimeInfo): string => {
  let uiTitle;

  if(cmd.uiSchema) {
    if(cmd.uiSchema['ui:title']) {
      uiTitle = cmd.uiSchema['ui:title'];
    }

    if(!uiTitle && cmd.uiSchema['ui:options'] && cmd.uiSchema['ui:options'].title) {
      uiTitle = cmd.uiSchema['ui:options'].title;
    }
  }

  const title = uiTitle || cmd.schema.title || cmd.desc.name;

  if(title === cmd.desc.name) {
    const parts = cmd.desc.name.split(".");
    return camelCaseToTitle(parts[parts.length -1]);
  }

  return title as string;
}

const CommandButton = (props: CommandButtonProps) => {
  const {desc} = props.command;
  const newAggregate = isAggregateCommandDescription(desc) && desc.newAggregate;

  return (
    <Button
      key={desc.name}
      variant={props.variant || 'contained'}
      sx={{ textTransform: 'none', margin: '5px', ...props.style }}
      color={props.buttonColor? props.buttonColor : 'primary'}
      startIcon={props.startIcon? props.startIcon : newAggregate ? <Plus /> : undefined}
      children={props.label? props.label : commandTitle(props.command)}
      onClick={props.onClick}
      disabled={!!props.disabled}
    />
  );
};

export default CommandButton;
