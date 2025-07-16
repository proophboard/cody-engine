import {Action, CodyPlayConfig, getEditedContextFromConfig} from "@cody-play/state/config-store";
import {Action as AppAction, ActionContainerInfo} from "@frontend/app/components/core/form/types/action";
import {isSameAction} from "@cody-play/infrastructure/vibe-cody/utils/set-button-property";
import {playDefinitionIdFromFQCN} from "@cody-play/infrastructure/cody/schema/play-definition-id";

const updateViewButtonPosition = (
  config: CodyPlayConfig,
  dispatch: (a: Action) => void,
  containerInfo: ActionContainerInfo,
  buttonPosition: string,
  movedAction: AppAction
) => {
  const ctx = getEditedContextFromConfig(config);
  const informationRuntimeInfo = config.types[containerInfo.name];
  const uiOptions = informationRuntimeInfo.uiSchema?.['ui:options'];
  const uiOptionsActions = uiOptions
    ? (uiOptions.actions as AppAction[])
    : undefined;
  const actions = uiOptionsActions
    ? uiOptionsActions.map((action) => ({
      ...action,
      position:
        isSameAction(action, movedAction)
          ? buttonPosition
          : action.position,
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
export default updateViewButtonPosition;
