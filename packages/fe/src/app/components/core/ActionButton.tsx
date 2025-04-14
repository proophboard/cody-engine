import * as React from 'react';
import {Action, isCommandAction, isLinkAction, isRulesAction} from "@frontend/app/components/core/form/types/action";
import {MouseEvent, PropsWithChildren, useContext} from "react";
import {configStore} from "@cody-play/state/config-store";
import {Alert, Button, IconButton} from '@mui/material';
import PlayCommand from "@cody-play/app/components/core/PlayCommand";
import {ButtonConfig, determineButtonConfig} from "@frontend/app/components/core/button/determine-button-config";
import {getPageDefinition} from "@cody-play/infrastructure/ui-table/utils";
import {PageDefinition} from "@frontend/app/pages/page-definitions";
import PageLink, {generatePageLink} from "@frontend/app/components/core/PageLink";
import {PageLinkTableColumn} from "@cody-play/infrastructure/cody/vo/play-vo-metadata";
import {FormJexlContext} from "@frontend/app/components/core/form/types/form-jexl-context";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {useGlobalStore} from "@frontend/hooks/use-global-store";
import {useEnv} from "@frontend/hooks/use-env";
import {commands} from "@frontend/app/components/commands";
import {Link, useParams} from "react-router-dom";
import {TableRowJexlContext} from "@frontend/app/components/core/table/table-row-jexl-context";
import {execMappingSync} from "@app/shared/rule-engine/exec-mapping";
import {makeAsyncExecutable} from "@cody-play/infrastructure/rule-engine/make-executable";
import PlayConnectedCommand from "@cody-play/app/components/core/PlayConnectedCommand";

interface OwnProps {
  action: Action;
  defaultService: string;
  jexlCtx: FormJexlContext | TableRowJexlContext;
  onDialogClose?: () => void;
}

type ActionButtonProps = OwnProps;

const makeButton = (config: ButtonConfig, additionalProps: object) => {
  if (config.hidden) {
    return <></>;
  }

  if (config.icon && !config.label) {
    return (
      <IconButton
        sx={config.style}
        color={config.color}
        disabled={config.disabled}
        {...additionalProps}
      >
        {config.icon}
      </IconButton>
    );
  } else {
    return (
      <Button
        variant={config.variant}
        sx={{ ...config.style }}
        color={config.color}
        startIcon={config.icon}
        endIcon={config.endIcon}
        children={config.label ? config.label : 'change'}
        disabled={config.disabled}
        {...additionalProps}
      />
    );
  }
};

const ActionButton = ({ action, defaultService, jexlCtx, onDialogClose }: ActionButtonProps) => {
  const env = useEnv();
  const { config } = useContext(configStore);
  const [, setGlobalStore] = useGlobalStore();
  const params = useParams();
  const buttonProps = determineButtonConfig(action.button, {}, jexlCtx, env);

  if (isCommandAction(action)) {
    let initialValues;

    if(action.data) {
      initialValues = execMappingSync(action.data, jexlCtx);
    }

    if (env.UI_ENV == 'play') {
      const command = config.commands[action.command];

      if (!command) {
        return (
          <Alert severity="error">{`Command "${action.command}" not found! You have to pass the command to Cody on prooph board.`}</Alert>
        );
      }

      if(action.connectTo) {
        return <PlayConnectedCommand  command={command} connectTo={action.connectTo} buttonProps={buttonProps} uiSchemaOverride={action.uiSchema} forceSchema={action.forceSchema} />;
      }

      return <PlayCommand command={command} buttonProps={buttonProps} initialValues={initialValues} onDialogClose={onDialogClose} uiSchemaOverride={action.uiSchema} />;
    }

    const CmdComponent = commands[action.command];

    if (!CmdComponent) {
      return (
        <Alert severity="error">{'Unknown command: ' + action.command}</Alert>
      );
    }

    return <CmdComponent buttonProps={buttonProps} {...params} initialValues={initialValues} onDialogClose={onDialogClose} />;
  }

  if (isLinkAction(action)) {
    if (action.href) {
      return makeButton(action.button, { component: 'a', href: action.href });
    } else if (action.pageLink) {
      const paramsMapping: Record<string, any> = {};
      const pageLink = typeof action.pageLink === "string" ? {page: action.pageLink, mapping: undefined} : action.pageLink;

      if (typeof pageLink === 'object' && pageLink.mapping) {
        for (const mappingKey in pageLink.mapping) {
          paramsMapping[mappingKey] = jexl.evalSync(
            pageLink.mapping[mappingKey],
            jexlCtx
          );
        }
      }

      const path = generatePageLink(
        getPageDefinition(
          pageLink as PageLinkTableColumn,
          defaultService,
          config.pages
        ) as unknown as PageDefinition,
        { ...jexlCtx.routeParams, ...paramsMapping }
      );

      return makeButton(buttonProps, { component: Link, to: path })
    }
  }

  if (isRulesAction(action)) {
    return makeButton(buttonProps, {
      onClick: (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        (async () => {
          const exec = makeAsyncExecutable(action.rules);
          await exec(jexlCtx);
          setGlobalStore(jexlCtx.store);
        })().catch((e) => console.error(e));
      },
    });
  }

  return <></>;
};

export default ActionButton;
