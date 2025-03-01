import * as React from 'react';
import {Action, isCommandAction, isLinkAction, isRulesAction} from "@frontend/app/components/core/form/types/action";
import {MouseEvent, useContext} from "react";
import {configStore} from "@cody-play/state/config-store";
import {Alert, Button, IconButton} from '@mui/material';
import PlayCommand from "@cody-play/app/components/core/PlayCommand";
import {ButtonConfig} from "@frontend/app/components/core/button/determine-button-config";
import {getPageDefinition} from "@cody-play/infrastructure/ui-table/utils";
import {PageDefinition} from "@frontend/app/pages/page-definitions";
import PageLink from "@frontend/app/components/core/PageLink";
import {PageLinkTableColumn} from "@cody-play/infrastructure/cody/vo/play-vo-metadata";
import {FormJexlContext} from "@frontend/app/components/core/form/types/form-jexl-context";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {useGlobalStore} from "@frontend/hooks/use-global-store";
import {useEnv} from "@frontend/hooks/use-env";
import {commands} from "@frontend/app/components/commands";
import {useParams} from "react-router-dom";
import {TableRowJexlContext} from "@frontend/app/components/core/table/table-row-jexl-context";
import {execMappingSync} from "@app/shared/rule-engine/exec-mapping";
import {makeAsyncExecutable} from "@cody-play/infrastructure/rule-engine/make-executable";

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

  if (isCommandAction(action)) {
    let initialValues;

    if(action.data) {
      initialValues = execMappingSync(action.data, jexlCtx);
    }

    if (env.UI_ENV == 'play') {
      const command = config.commands[action.command];

      if (!command) {
        return (
          <Alert severity="error">{'Unknown command: ' + action.command}</Alert>
        );
      }

      return <PlayCommand command={command} buttonProps={action.button} initialValues={initialValues} onDialogClose={onDialogClose} />;
    }

    const CmdComponent = commands[action.command];

    if (!CmdComponent) {
      return (
        <Alert severity="error">{'Unknown command: ' + action.command}</Alert>
      );
    }

    return <CmdComponent buttonProps={action.button} {...params} initialValues={initialValues} onDialogClose={onDialogClose} />;
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

      return makeButton(action.button, { component: () => <PageLink
          page={
            getPageDefinition(
              pageLink as PageLinkTableColumn,
              defaultService,
              config.pages
            ) as unknown as PageDefinition
          }
          params={{ ...jexlCtx.routeParams, ...paramsMapping }}
        >
          {action.button.icon && !action.button.label
            ? action.button.icon
            : action.button.label}
        </PageLink> });
    }
  }

  if (isRulesAction(action)) {
    return makeButton(action.button, {
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
