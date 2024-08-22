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
import {PlayInformationRuntimeInfo} from "@cody-play/state/types";
import {PageLinkTableColumn} from "@cody-play/infrastructure/cody/vo/play-vo-metadata";
import {FormJexlContext} from "@frontend/app/components/core/form/types/form-jexl-context";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {useGlobalStore} from "@frontend/hooks/use-global-store";
import {makeAsyncExecutable} from "@cody-play/infrastructure/rule-engine/make-executable";
import MdiIcon from "@cody-play/app/components/core/MdiIcon";

interface OwnProps {
  action: Action;
  information: PlayInformationRuntimeInfo;
  jexlCtx: FormJexlContext;
}

type ActionButtonProps = OwnProps;

const makeButton = (config: ButtonConfig, additionalProps: object) => {
  if(config.hidden) {
    return <></>;
  }

  console.log("button config", config);

  if(config.icon && !config.label) {
    return <IconButton sx={config.style}
                       color={config.color}
                       disabled={config.disabled}
                       {...additionalProps}
                       >{config.icon}</IconButton>
  } else {
    return <Button variant={config.variant}
                   sx={{ textTransform: 'none', margin: '5px', ...config.style }}
                   color={config.color}
                   startIcon={config.icon}
                   endIcon={config.endIcon}
                   children={config.label? config.label : "change"}
                   disabled={config.disabled}
                   {...additionalProps}
    />
  }
}

const ActionButton = ({action, information, jexlCtx}: ActionButtonProps) => {
  const {config} = useContext(configStore);
  const [,setGlobalStore] = useGlobalStore();

  if(isCommandAction(action)) {
    const command = config.commands[action.command];

    if(!command) {
      return <Alert severity="error">{"Unknown command: " + action.command}</Alert>
    }

    return <PlayCommand command={command} buttonProps={action.button} />
  }

  if(isLinkAction(action)) {
    if(action.href) {
      return makeButton(action.button, {component: "a", href: action.href});
    } else if(action.pageLink) {
      const paramsMapping: Record<string, any> = {};

      if(typeof action.pageLink === "object" && action.pageLink.mapping) {
        for (const mappingKey in action.pageLink.mapping) {
          paramsMapping[mappingKey] = jexl.evalSync(action.pageLink.mapping[mappingKey], jexlCtx);
        }
      }

      const CompiledPageLink = <PageLink page={getPageDefinition(action.pageLink as PageLinkTableColumn, information, config.pages) as unknown as PageDefinition}
                                         params={{...jexlCtx.routeParams, ...paramsMapping}}
      >{(action.button.icon && !action.button.label ? action.button.icon : action.button.label)}</PageLink>;

      return makeButton(action.button, {component: CompiledPageLink});
    }
  }

  if(isRulesAction(action)) {
    return makeButton(action.button, {onClick: (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        (async () => {
          const exec = makeAsyncExecutable(action.rules);
          await exec(jexlCtx);
          setGlobalStore(jexlCtx.store);
        })().catch(e => console.error(e));
      }})
  }

  return <></>;
};

export default ActionButton;
