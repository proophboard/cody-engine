import {FocusedButton} from "@cody-play/state/focused-element";
import {ButtonConfig} from "@frontend/app/components/core/button/button-config";
import {PlayConfigDispatch} from "@cody-play/infrastructure/cody/cody-message-server";
import {CodyInstructionResponse} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {CodyPlayConfig, getEditedContextFromConfig} from "@cody-play/state/config-store";
import {
  Action, ButtonAction, CommandAction, isButtonAction,
  isCommandAction,
  isFormAction,
  isLinkAction,
  LinkAction
} from "@frontend/app/components/core/form/types/action";
import {playDefinitionIdFromFQCN} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import {CodyResponseType} from "@proophboard/cody-types";
import {isSameCommand} from "@cody-play/infrastructure/vibe-cody/utils/move-button-position";

const pageLink = (action: LinkAction): string => action.pageLink ? typeof action.pageLink === "string" ? action.pageLink : action.pageLink.page : '';

export const isSameAction = (a: Action, b: Action): boolean => {
  if(isCommandAction(a)) {
    if(isCommandAction(b)) {
      return a.command === b.command;
    } else {
      return false;
    }
  }

  if(isLinkAction(a)) {
    if(isLinkAction(b)) {
      if(a.href) {
        return a.href === b.href;
      } else {
        return pageLink(a) === pageLink(b);
      }
    } else {
      return false;
    }
  }

  if(isFormAction(a)) {
    if(isFormAction(b)) {
      return a.name === b.name;
    } else {
      return false;
    }
  }

  return JSON.stringify(a) === JSON.stringify(b);
}

export const setButtonProperty = async (
  button: FocusedButton,
  property: keyof ButtonConfig,
  value: any,
  config: CodyPlayConfig,
  dispatch: PlayConfigDispatch
): Promise<true | CodyInstructionResponse> => {

  if(button.containerInfo.type === "view") {
    return await setButtonPropertyForViewButton(
      button,
      property,
      value,
      config,
      dispatch
    )
  }

  if(button.containerInfo.type === "page") {
    return await setButtonPropertyForPageButton(
      button,
      property,
      value,
       config,
      dispatch
    )
  }

  return {
    cody: `Container Info type: ${button.containerInfo.type} can't be handled.`,
    details: `This is a system bug. Please contact the prooph board Team!`,
    type: CodyResponseType.Error
  }
}

const setButtonPropertyForPageButton = async (
  {action, containerInfo, name}: FocusedButton,
  property: keyof ButtonConfig,
  value: any,
  config: CodyPlayConfig,
  dispatch: PlayConfigDispatch
): Promise<true | CodyInstructionResponse> => {
  const ctx = getEditedContextFromConfig(config);

  const pageDefinition = config.pages[containerInfo.name];
  const page = {
    ...pageDefinition,
    commands: pageDefinition.commands.map(c => {
      if(isSameCommand(c, action)) {
        const modifiedAction = typeof c === "string"? action : c;
        if(isButtonAction(modifiedAction)) {
          const button: ButtonConfig = modifiedAction.button || {};
          button[property] = value;
          modifiedAction.button = button;
        }

        return modifiedAction;
      }

      return c;
    }),
  };

  dispatch({
    ctx,
    type: 'ADD_PAGE',
    page,
    name: containerInfo.name,
  });

  return true;
}

const setButtonPropertyForViewButton = async (
  {action, containerInfo, name}: FocusedButton,
  property: keyof ButtonConfig,
  value: any,
  config: CodyPlayConfig,
  dispatch: PlayConfigDispatch
): Promise<true | CodyInstructionResponse> => {
  const ctx = getEditedContextFromConfig(config);

  const informationRuntimeInfo = config.types[containerInfo.name];
  const uiOptions = informationRuntimeInfo.uiSchema?.['ui:options'];
  const uiOptionsActions = uiOptions
    ? (uiOptions.actions as Action[])
    : undefined;
  const actions = uiOptionsActions
    ?
    uiOptionsActions.map((a) => {
      if (isSameAction(a, action) && isButtonAction(a)) {
        const copyOfButton = {...a.button};
        if(typeof value === "undefined") {
          delete copyOfButton[property];
        } else {
          copyOfButton[property] = value;
        }

        return {...a, button: copyOfButton}
      } else {
        return a;
      }
    })
    : [];

  const information = {
    ...informationRuntimeInfo,
    uiSchema: {
      ...informationRuntimeInfo.uiSchema,
      'ui:options': {
        ...uiOptions,
        actions,
      },
    },
  };

  const definitionId = playDefinitionIdFromFQCN(containerInfo.name);

  dispatch({
    ctx,
    type: 'ADD_TYPE',
    name: containerInfo.name,
    information,
    definition: {
      definitionId,
      schema: config.definitions[definitionId],
    },
  });

  return true;
}
