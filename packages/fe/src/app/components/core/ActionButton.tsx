import * as React from 'react';
import {
  ButtonAction,
  isCommandAction,
  isLinkAction,
  isRulesAction, LinkAction
} from "@frontend/app/components/core/form/types/action";
import {MouseEvent, PropsWithChildren, useContext, useState} from "react";
import {configStore} from "@cody-play/state/config-store";
import {Alert, Button, CSSProperties, IconButton, Typography, useTheme} from '@mui/material';
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
import {Square} from "mdi-material-ui";
import {GridActionsCellItem} from "@mui/x-data-grid";
import {usePageData} from "@frontend/hooks/use-page-data";
import {useTranslation} from "react-i18next";
import {TFunction} from "i18next";
import ConfirmationDialog from "@frontend/app/components/core/dialogs/ConfirmationDialog";
import {isPageFormReference} from "@app/shared/types/core/page-data/page-data";

interface OwnProps {
  action: ButtonAction;
  defaultService: string;
  jexlCtx: FormJexlContext | TableRowJexlContext;
  onDialogClose?: () => void;
  asGridActionsCellItem?: boolean;
  showInMenu?: boolean;
}

type ActionButtonProps = OwnProps;

const makeGridActionsCellItemLink = (config: ButtonConfig, to: string, external: boolean, navigate: (to: string) => void, t: TFunction) => {
  return <GridActionsCellItem
    label={config['label:t'] ? t(config['label:t']) : config.label || ''}
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
    color={config.color === 'default' ? undefined : config.color as 'default' | 'inherit' | 'primary'}
    style={{ ...config.style } as CSSProperties}
  />
}

const makeGridActionsCellItemRulesBtn = (config: ButtonConfig, onClick: () => void, t: TFunction) => {
  return <GridActionsCellItem
    label={config['label:t'] ? t(config['label:t']) : config.label || ''}
    icon={(config.icon ? config.icon :  <Square />) as any}
    showInMenu={config.showInMenu}
    onClick={onClick}
    disabled={config.disabled}
    color={config.color === 'default' ? undefined : config.color as 'default' | 'inherit' | 'primary'}
    style={{ ...config.style } as CSSProperties}
  />
}

const makeButton = (config: ButtonConfig, additionalProps: object, t: TFunction) => {
  if (config.hidden) {
    return <></>;
  }

  if (config.icon && !config.label) {
    return (
      <IconButton
        sx={config.style}
        color={config.color === 'default' ? undefined : config.color}
        disabled={config.disabled}
        className={config.className}
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
        children={config['label:t'] ? t(config['label:t']) : config.label || 'Change'}
        disabled={config.disabled}
        className={config.className}
        {...additionalProps}
      />
    );
  }
};

const MakeConfirmationButton = (
  action: LinkAction,
  additionalProps: any,
  t: TFunction
) => {
  const [dialog, setDialog] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const [page,] = usePageData();

  return (
    <>
      {makeButton(
        action.button,
        {
          ...additionalProps,
          onClick: (event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();
            setDialog(true);
          },
        },
        t
      )}
      <ConfirmationDialog
        open={dialog}
        onClose={() => setDialog(false)}
        title={
          action['confirmTitle:t']
            ? t(action['confirmTitle:t'])
            : action.confirmTitle || t('common.confirm', 'Do you really want to leave the page?')
        }
        onConfirmClick={() => {
          if(action.cancelForm) {
            const form = page[action.cancelForm];

            if(!isPageFormReference(form)) {
              console.warn(`Cannot find the form "${action.cancelForm}" to be canceled on the page. Configure a view of type "form" on the same page as the link action.`);
            } else {
              form.cancel();
            }
          }

          if (additionalProps.href) {
            window.open(additionalProps.href, '_blank');
          } else if (additionalProps.to) {
            navigate(additionalProps.to);
          }
          setDialog(false);
        }}
        confirmButtonText={
          action['confirmAcceptText:t']
            ? t(action['confirmAcceptText:t'])
            : action.confirmAcceptText || t('common.confirm', 'Yes')
        }
        abortButtonText={
          action['confirmCancelText:t']
            ? t(action['confirmCancelText:t'])
            : action.confirmCancelText || t('common.cancel', 'Cancel')
        }
      >
        <Typography sx={{ paddingLeft: theme.spacing(1) }}>
          {action['confirmText:t']
            ? t(action['confirmText:t'])
            : action.confirmText || t('common.confirmDefaultLinkMessage', 'Your entered data will be lost!')}
        </Typography>
      </ConfirmationDialog>
    </>
  );
};

const ActionButton = ({ action, defaultService, jexlCtx, onDialogClose, asGridActionsCellItem, showInMenu }: ActionButtonProps) => {
  const env = useEnv();
  const { t } = useTranslation();
  const { config } = useContext(configStore);
  const [, setGlobalStore] = useGlobalStore();
  const [page] = usePageData();
  const params = useParams();
  const buttonProps = determineButtonConfig({...action.button, className: 'CodyAction-root'}, {}, jexlCtx, env);
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

    let onClick = undefined;

    if(action.cancelForm) {
      onClick = () => {
        const form = page[action.cancelForm!];

        if(!isPageFormReference(form)) {
          console.warn(`Cannot find the form "${action.cancelForm}" to be canceled on the page. Configure a view of type "form" on the same page as the link action.`);
        } else {
          form.cancel();
        }
      }
    }

    if (action.href) {
      if(buttonProps.asGridActionsCellItem) {
        return makeGridActionsCellItemLink(buttonProps, action.href, true, navigate, t);
      }

      if (action.needsConfirmation) {
        return MakeConfirmationButton(
          action,
          { component: 'a', href: action.href },
          t
        );
      }

      return makeButton({...action.button, asGridActionsCellItem, showInMenu, className: 'CodyAction-root'}, { component: 'a', href: action.href, onClick }, t);
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

      if(buttonProps.asGridActionsCellItem) {
        return makeGridActionsCellItemLink(buttonProps, path, false, navigate, t);
      }

      if (action.needsConfirmation) {
        return MakeConfirmationButton(action, { component: Link, to: path }, t);
      }

      return makeButton(buttonProps, { component: Link, to: path, onClick }, t);
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
      }, t)
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
    }, t);
  }

  return <></>;
};

export default ActionButton;
