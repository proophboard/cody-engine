import * as React from 'react';
import {Action, isCommandAction, isLinkAction, isRulesAction} from "@frontend/app/components/core/form/types/action";
import {MouseEvent, PropsWithChildren, useContext} from "react";
import {configStore} from "@cody-play/state/config-store";
import {Alert, Button, IconButton} from '@mui/material';
import PlayCommand from "@cody-play/app/components/core/PlayCommand";
import {determineButtonConfig} from "@frontend/app/components/core/button/determine-button-config";
import {generatePageLink, getPageDefinition} from "@frontend/app/components/core/PageLink";
import {FormJexlContext} from "@frontend/app/components/core/form/types/form-jexl-context";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {useGlobalStore} from "@frontend/hooks/use-global-store";
import {useEnv} from "@frontend/hooks/use-env";
import {commands} from "@frontend/app/components/commands";
import {Link, useNavigate, useParams} from "react-router-dom";
import {TableRowJexlContext} from "@frontend/app/components/core/table/table-row-jexl-context";
import {execMappingSync} from "@app/shared/rule-engine/exec-mapping";
import {makeAsyncExecutable} from "@cody-play/infrastructure/rule-engine/make-executable";
import PlayConnectedCommand from "@cody-play/app/components/core/PlayConnectedCommand";
import PlayDirectSubmitCommand from "@cody-play/app/components/core/PlayDirectSubmitCommand";
import {ButtonConfig} from "@frontend/app/components/core/button/button-config";
import {Plus, Square} from "mdi-material-ui";
import {GridActionsCellItem} from "@mui/x-data-grid";
import {commandTitle} from "@frontend/app/components/core/CommandButton";

interface OwnProps {
  action: Action;
  defaultService: string;
  jexlCtx: FormJexlContext | TableRowJexlContext;
  onDialogClose?: () => void;
  asGridActionsCellItem?: boolean;
  showInMenu?: boolean;
}

type ActionButtonProps = OwnProps;

const makeGridActionsCellItemLink = (config: ButtonConfig, to: string, external: boolean, navigate: (to: string) => void) => {
  return <GridActionsCellItem
    label={config.label || ''}
    icon={(config.icon ? config.icon :  <Square />) as any}
    showInMenu={config.showInMenu}
    onClick={(e: any) => {
      if(external) {
        window.location.href = to;
      } else {
        navigate(to);
      }
    }}
    disabled={config.disabled}
    color={config.color === 'default' ? undefined : config.color}
    sx={{ ...config.style }}
  />
}

const makeGridActionsCellItemRulesBtn = (config: ButtonConfig, onClick: () => void) => {
  return <GridActionsCellItem
    label={config.label || ''}
    icon={(config.icon ? config.icon :  <Square />) as any}
    showInMenu={config.showInMenu}
    onClick={onClick}
    disabled={config.disabled}
    color={config.color === 'default' ? undefined : config.color}
    sx={{ ...config.style }}
  />
}

const makeButton = (config: ButtonConfig, additionalProps: object) => {
  if (config.hidden) {
    return <></>;
  }

  if (config.icon && !config.label) {
    return (
      <IconButton
        sx={config.style}
        color={config.color === 'default' ? undefined : config.color}
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
        color={config.color === 'default' ? undefined : config.color}
        startIcon={config.icon}
        endIcon={config.endIcon}
        children={config.label ? config.label : 'change'}
        disabled={config.disabled}
        {...additionalProps}
      />
    );
  }
};

const ActionButton = ({ action, defaultService, jexlCtx, onDialogClose, asGridActionsCellItem, showInMenu }: ActionButtonProps) => {
  const env = useEnv();
  const { config } = useContext(configStore);
  const [, setGlobalStore] = useGlobalStore();
  const params = useParams();
  const buttonProps = determineButtonConfig(action.button, {}, jexlCtx, env);
  const navigate = useNavigate();

  if(asGridActionsCellItem) {
    buttonProps.asGridActionsCellItem = true;

    if(showInMenu) {
      buttonProps.showInMenu = true;
    }
  }

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

      if(action.directSubmit) {
        return <PlayDirectSubmitCommand command={command} data={initialValues} buttonProps={buttonProps} uiSchemaOverride={action.uiSchema} />
      }

      return <PlayCommand command={command} buttonProps={buttonProps} initialValues={initialValues} onDialogClose={onDialogClose} uiSchemaOverride={action.uiSchema} />;
    }

    const CmdComponent = commands[action.command];

    if (!CmdComponent) {
      return (
        <Alert severity="error">{'Unknown command: ' + action.command}</Alert>
      );
    }

    return <CmdComponent buttonProps={buttonProps}
                         {...params}
                         initialValues={initialValues}
                         onDialogClose={onDialogClose}
                         uiSchemaOverride={action.uiSchema}
                         connectTo={action.connectTo}
                         directSubmit={action.directSubmit}
                         forceSchema={action.forceSchema}
    />;
  }

  if (isLinkAction(action)) {
    if (action.href) {
      return buttonProps.asGridActionsCellItem
        ? makeGridActionsCellItemLink(buttonProps, action.href, true, navigate)
        : makeButton({...action.button, asGridActionsCellItem, showInMenu}, { component: 'a', href: action.href });
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
          pageLink.page,
          defaultService,
          env.PAGES
        ),
        { ...jexlCtx.routeParams, ...paramsMapping }
      );

      return buttonProps.asGridActionsCellItem
        ? makeGridActionsCellItemLink(buttonProps, path, false, navigate)
        : makeButton(buttonProps, { component: Link, to: path })
    }
  }

  if (isRulesAction(action)) {
    return buttonProps.asGridActionsCellItem
      ? makeGridActionsCellItemRulesBtn(buttonProps, () => {
        (async () => {
          const exec = makeAsyncExecutable(action.rules);
          await exec(jexlCtx);
          setGlobalStore(jexlCtx.store);
        })().catch((e) => console.error(e));
      })
      : makeButton(buttonProps, {
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
