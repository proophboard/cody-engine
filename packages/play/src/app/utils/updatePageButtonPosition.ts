import {
  Action,
  CodyPlayConfig,
  getEditedContextFromConfig,
} from '@cody-play/state/config-store';
import {
  Action as AppAction,
  ActionContainerInfo,
  ButtonPosition
} from '@frontend/app/components/core/form/types/action';
import {isSameAction} from "@cody-play/infrastructure/vibe-cody/utils/set-button-property";
import {isSameCommand} from "@cody-play/app/utils/moveButtonPosition";

const updatePageButtonPosition = (
  config: CodyPlayConfig,
  dispatch: (a: Action) => void,
  containerInfo: ActionContainerInfo,
  buttonPosition: ButtonPosition,
  movedAction: AppAction
) => {
  const ctx = getEditedContextFromConfig(config);
  const pageDefinition = config.pages[containerInfo.name];
  const page = {
    ...pageDefinition,
    commands: pageDefinition.commands.map((command) => {
      if(isSameCommand(command, movedAction)) {
        return typeof command === "string"
          ? {...movedAction, position: buttonPosition}
          : {...command, position: buttonPosition}
      }

      if(typeof command !== "string" && isSameAction(command, movedAction)) {
        return {
          ...command,
          position: buttonPosition
        }
      }

      return command;
    }),
  };

  dispatch({
    ctx,
    type: 'ADD_PAGE',
    page,
    name: containerInfo.name,
  });
};

export default updatePageButtonPosition;
