import * as React from 'react';
import { CommandRuntimeInfo } from '@event-engine/messaging/command';
import { camelCaseToTitle } from '@frontend/util/string';
import { Button, IconButton } from '@mui/material';
import { isAggregateCommandDescription } from '@event-engine/descriptions/descriptions';
import { Plus } from 'mdi-material-ui';
import { useUser } from '@frontend/hooks/use-user';
import { usePageData } from '@frontend/hooks/use-page-data';
import {
  ButtonConfig,
  ButtonProps,
  determineButtonConfig,
} from '@frontend/app/components/core/button/determine-button-config';
import { useParams } from 'react-router-dom';
import { useGlobalStore } from '@frontend/hooks/use-global-store';
import {TFunction} from "i18next";
import {translateUiSchema} from "@frontend/util/schema/translate-ui-schema";
import {translateSchema} from "@frontend/util/schema/translate-schema";
import {useTranslation} from "react-i18next";

interface OwnProps {
  command: CommandRuntimeInfo;
  onClick: () => void;
  formData?: { [prop: string]: any };
}

export type CommandButtonProps = OwnProps & ButtonProps & Partial<ButtonConfig>;

export interface WithCommandButtonProps {
  buttonProps?: Partial<CommandButtonProps>;
}

export const commandTitle = (cmd: CommandRuntimeInfo, t: TFunction): string => {
  let title;

  if (cmd.uiSchema) {
    const uiSchema = translateUiSchema(cmd.uiSchema, `${cmd.desc.name}.uiSchema`, t);
    if (uiSchema['ui:title']) {
      title = uiSchema['ui:title'];
    }

    if (
      !title &&
      uiSchema['ui:options'] &&
      uiSchema['ui:options'].title
    ) {
      title = uiSchema['ui:options'].title;
    }
  }

  if(!title) {
    const cmdSchema = translateSchema(cmd.schema as any, `${cmd.desc.name}.schema`, t);

    title = cmdSchema.title || cmd.desc.name;
  }

  if (title === cmd.desc.name) {
    const parts = cmd.desc.name.split('.');
    return camelCaseToTitle(parts[parts.length - 1]);
  }

  return title as string;
};

const CommandButton = (props: CommandButtonProps) => {
  const { desc } = props.command;
  const [user] = useUser();
  const [page] = usePageData();
  const routeParams = useParams();
  const [store] = useGlobalStore();
  const {t} = useTranslation();

  const { variant, color, disabled, style, hidden, icon, label } =
    determineButtonConfig(props, props.command.uiSchema || {}, {
      user,
      page,
      routeParams,
      data: props.formData || {},
      store,
    });
  const newAggregate = isAggregateCommandDescription(desc) && desc.newAggregate;

  if (hidden) {
    return <></>;
  }

  if (icon && !label) {
    return (
      <IconButton
        key={desc.name}
        sx={style}
        color={color}
        onClick={props.onClick}
        disabled={disabled}
      >
        {icon}
      </IconButton>
    );
  }

  return (
    <Button
      key={desc.name}
      variant={variant}
      sx={{ ...style }}
      color={color}
      startIcon={
        props.startIcon ? props.startIcon : newAggregate ? <Plus /> : undefined
      }
      children={props.label ? props.label : commandTitle(props.command, t)}
      onClick={props.onClick}
      disabled={disabled}
    />
  );
};

export default CommandButton;
