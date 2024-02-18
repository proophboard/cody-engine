import * as React from 'react';
import {CommandRuntimeInfo} from "@event-engine/messaging/command";
import {camelCaseToTitle} from "@frontend/util/string";
import {Button, SxProps} from "@mui/material";
import {isAggregateCommandDescription} from "@event-engine/descriptions/descriptions";
import {Plus} from "mdi-material-ui";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {User} from "@app/shared/types/core/user/user";
import {useUser} from "@frontend/hooks/use-user";
import {PageData} from "@app/shared/types/core/page-data/page-data";
import {usePageData} from "@frontend/hooks/use-page-data";

interface OwnProps {
  command: CommandRuntimeInfo;
  onClick: () => void;
  label?: string;
  startIcon?: React.ReactNode | undefined;
  buttonColor?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | undefined;
  style?: SxProps;
  disabled?: boolean;
  hidden?: boolean;
  variant?: "text" | "outlined" | "contained";
  formData?: {[prop: string]: any};
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

const determineButtonConfig = (props: CommandButtonProps, user: User, page: PageData):
  {
    variant: "text" | "outlined" | "contained",
    color: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning',
    disabled: boolean,
    style: SxProps,
    hidden: boolean
  } => {
  const uiSchema = props.command.uiSchema || {};
  const jexlCtx = {data: {...props.formData}, user, page};

  const uiButtonConfig = uiSchema['ui:button'] || {};

  if(uiButtonConfig['variantExpr']) {
    uiButtonConfig['variant'] = jexl.evalSync(uiButtonConfig['variantExpr'], jexlCtx);
  }

  if(uiButtonConfig['colorExpr']) {
    uiButtonConfig['color'] = jexl.evalSync(uiButtonConfig['colorExpr'], jexlCtx);
  }

  if(uiButtonConfig['styleExpr']) {
    uiButtonConfig['style'] = jexl.evalSync(uiButtonConfig['styleExpr'], jexlCtx);
  }

  const variant = props.variant || uiButtonConfig['variant'] || 'contained';
  const color = props.buttonColor || uiButtonConfig['color'] || 'primary';
  const style = props.style || uiButtonConfig['style'] || undefined;

  let disabled = false;

  if(props.disabled) {
    disabled = true;
  } else if (uiButtonConfig['disabled']) {
    const btnCDisabled = uiButtonConfig['disabled'];

    if(typeof btnCDisabled === "boolean") {
      disabled = btnCDisabled;
    }

    if(typeof btnCDisabled === "string") {
      disabled = jexl.evalSync(btnCDisabled, jexlCtx);
    }
  }

  let hidden = false;

  if(props.hidden) {
    hidden = true;
  } else if (uiButtonConfig['hidden']) {
    const btnCHidden = uiButtonConfig['hidden'];

    if(typeof btnCHidden === "boolean") {
      hidden = btnCHidden;
    }

    if(typeof btnCHidden === "string") {
      hidden = jexl.evalSync(btnCHidden, jexlCtx);
    }
  }

  return {
    variant,
    color,
    style,
    disabled,
    hidden,
  }
}

const CommandButton = (props: CommandButtonProps) => {
  const {desc} = props.command;
  const [user,] = useUser();
  const [page,] = usePageData();
  const {variant, color, disabled, style, hidden} = determineButtonConfig(props, user, page);
  const newAggregate = isAggregateCommandDescription(desc) && desc.newAggregate;

  if(hidden) {
    return <></>
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
