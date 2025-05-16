import {
  Action,
  CodyPlayConfig,
  getEditedContextFromConfig,
} from '@cody-play/state/config-store';
import { ActionContainerInfo } from '@frontend/app/components/core/form/types/action';
import { playDefinitionIdFromFQCN } from '@cody-play/infrastructure/cody/schema/play-definition-id';
import { CommandComponent } from '@cody-engine/cody/hooks/utils/ui/types';

const moveButtonPosition = (
  config: CodyPlayConfig,
  dispatch: (a: Action) => void,
  containerInfo: ActionContainerInfo,
  prevContainerInfo: ActionContainerInfo,
  buttonPosition: string,
  commandName?: string
) => {
  const ctx = getEditedContextFromConfig(config);

  // button was moved from table view to page view
  if (prevContainerInfo.type === 'view' && containerInfo.type === 'page') {
    const informationRuntimeInfo = config.types[prevContainerInfo.name];
    const uiOptions = informationRuntimeInfo.uiSchema?.['ui:options'];
    const uiOptionsActions = uiOptions
      ? (uiOptions.actions as object[])
      : undefined;
    const actions = uiOptionsActions
      ? // @ts-expect-error TS2339: Property command does not exist on type object
        uiOptionsActions.filter((a) => commandName !== a.command)
      : [];
    const foundAction = uiOptionsActions
      ? // @ts-expect-error TS2339: Property command does not exist on type object
        uiOptionsActions.find((a) => commandName === a.command)
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
    // TODO implement me
  }
};

export default moveButtonPosition;
