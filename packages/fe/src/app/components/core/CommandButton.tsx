import * as React from 'react';
import {CommandRuntimeInfo} from "@event-engine/messaging/command";
import {camelCaseToTitle} from "@frontend/util/string";
import {Button, IconButton} from "@mui/material";
import {isAggregateCommandDescription} from "@event-engine/descriptions/descriptions";
import {Plus} from "mdi-material-ui";
import {useUser} from "@frontend/hooks/use-user";
import {usePageData} from "@frontend/hooks/use-page-data";
import {
  ButtonConfig,
  ButtonProps,
  determineButtonConfig
} from "@frontend/app/components/core/button/determine-button-config";
import {useParams} from "react-router-dom";
import {useGlobalStore} from "@frontend/hooks/use-global-store";

interface OwnProps {
  command: CommandRuntimeInfo;
  onClick: () => void;
  formData?: {[prop: string]: any};
}

export type CommandButtonProps = OwnProps & ButtonProps & Partial<ButtonConfig>;

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
  const [user,] = useUser();
  const [page,] = usePageData();
  const routeParams = useParams();
  const [store] = useGlobalStore();

  const {variant, color, disabled, style, hidden, icon, label} = determineButtonConfig(props, props.command.uiSchema || {}, {
    user,
    page,
    routeParams,
    data: props.formData || {},
    store
  });
  const newAggregate = isAggregateCommandDescription(desc) && desc.newAggregate;

  if(hidden) {
    return <></>
  }

  if(icon && !label) {
    return <IconButton key={desc.name}
                       sx={style}
                       color={color}
                       onClick={props.onClick}
                       disabled={disabled}

    >{icon}</IconButton>
  }

  return (
    <Button
      key={desc.name}
      variant={variant}
      sx={{ textTransform: 'none', margin: '5px', ...style }}
      color={color}
      startIcon={props.startIcon? props.startIcon : newAggregate ? <Plus /> : undefined}
      children={props.label? props.label : commandTitle(props.command)}
      onClick={props.onClick}
      disabled={disabled}
    />
  );
};

export default CommandButton;
