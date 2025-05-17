import {
  Action,
  CodyPlayConfig,
  getEditedContextFromConfig,
} from '@cody-play/state/config-store';
import {ActionContainerInfo, isCommandAction} from '@frontend/app/components/core/form/types/action';
import { playDefinitionIdFromFQCN } from '@cody-play/infrastructure/cody/schema/play-definition-id';
import { CommandComponent } from '@cody-engine/cody/hooks/utils/ui/types';
import {Action as AppAction} from "@frontend/app/components/core/form/types/action";
import {isSameAction} from "@cody-play/infrastructure/vibe-cody/utils/set-button-property";

export const isSameCommand = (a: CommandComponent, b: AppAction): boolean => {
  if(typeof a === "string") {
    if(isCommandAction(b)) {
      return a === b.command;
    }

    return false;
  } else {
    return isSameAction(a, b);
  }
}

const moveButtonPosition = (
  config: CodyPlayConfig,
  dispatch: (a: Action) => void,
  containerInfo: ActionContainerInfo,
  prevContainerInfo: ActionContainerInfo,
  buttonPosition: string,
  movedAction: AppAction,
) => {
  const ctx = getEditedContextFromConfig(config);

  // button was moved from table view to page view
  if (prevContainerInfo.type === 'view' && containerInfo.type === 'page') {
    const informationRuntimeInfo = config.types[prevContainerInfo.name];
    const uiOptions = informationRuntimeInfo.uiSchema?.['ui:options'];
    const uiOptionsActions = uiOptions
      ? (uiOptions.actions as AppAction[])
      : undefined;
    const actions = uiOptionsActions
      ? uiOptionsActions.filter((a) => !isSameAction(a, movedAction))
      : [];
    const foundAction = uiOptionsActions
      ? uiOptionsActions.find((a) => isSameAction(a, movedAction))
      : undefined;
    const action = foundAction
      ? { ...foundAction, position: buttonPosition }
      : undefined;
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
    const definitionId = playDefinitionIdFromFQCN(prevContainerInfo.name);
    const pageDefinition = config.pages[containerInfo.name];
    const page = {
      ...pageDefinition,
      commands:
        action !== undefined
          ? [...pageDefinition.commands, action as CommandComponent]
          : pageDefinition.commands,
    };

    dispatch({
      ctx,
      type: 'ADD_TYPE',
      name: prevContainerInfo.name,
      information,
      definition: {
        definitionId,
        schema: config.definitions[definitionId],
      },
    });
    dispatch({
      ctx,
      type: 'ADD_PAGE',
      page,
      name: containerInfo.name,
    });
  }

  // button was moved from page view to table view
  if (prevContainerInfo.type === 'page' && containerInfo.type === 'view') {
    const pageDefinition = config.pages[prevContainerInfo.name];
    const commands = pageDefinition.commands.filter(
      (c) => !isSameCommand(c, movedAction)
    );
    const foundCommand = pageDefinition.commands.find(
      (c) => isSameCommand(c, movedAction)
    );
    const command = foundCommand
      ? typeof foundCommand === 'string'
        ? {...movedAction, position: buttonPosition }
        : { ...foundCommand, position: buttonPosition }
      : undefined;
    const page = {
      ...pageDefinition,
      commands,
    };
    const informationRuntimeInfo = config.types[containerInfo.name];
    const uiOptions = informationRuntimeInfo.uiSchema?.['ui:options'];
    const uiOptionsActions = uiOptions ? uiOptions.actions : undefined;
    const actions = uiOptionsActions
      ? [...(uiOptionsActions as any[]), command]
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
      type: 'ADD_PAGE',
      page,
      name: prevContainerInfo.name,
    });
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
  }
};

export default moveButtonPosition;
