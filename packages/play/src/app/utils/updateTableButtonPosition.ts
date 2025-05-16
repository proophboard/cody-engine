import {
  Action,
  CodyPlayConfig,
  getEditedContextFromConfig,
} from '@cody-play/state/config-store';
import { playDefinitionIdFromFQCN } from '@cody-play/infrastructure/cody/schema/play-definition-id';
import { ActionContainerInfo } from '@frontend/app/components/core/form/types/action';

const updateTableButtonPosition = (
  config: CodyPlayConfig,
  dispatch: (a: Action) => void,
  containerInfo: ActionContainerInfo,
  buttonPosition: string,
  commandName?: string
) => {
  const ctx = getEditedContextFromConfig(config);
  const informationRuntimeInfo = config.types[containerInfo.name];
  const uiOptions = informationRuntimeInfo.uiSchema?.['ui:options'];
  const uiOptionsActions = uiOptions
    ? (uiOptions.actions as object[])
    : undefined;
  const actions = uiOptionsActions
    ? uiOptionsActions.map((action) => ({
        ...action,
        position:
          // @ts-expect-error TS2339: Property command does not exist on type object
          commandName === action.command
            ? buttonPosition
            : // @ts-expect-error TS2339: Property position does not exist on type object
              action.position,
      }))
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
};

export default updateTableButtonPosition;
