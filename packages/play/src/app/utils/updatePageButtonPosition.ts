import {
  Action,
  CodyPlayConfig,
  getEditedContextFromConfig,
} from '@cody-play/state/config-store';
import { ActionContainerInfo } from '@frontend/app/components/core/form/types/action';

const updatePageButtonPosition = (
  config: CodyPlayConfig,
  dispatch: (a: Action) => void,
  containerInfo: ActionContainerInfo,
  buttonPosition: string,
  additionalData?: Record<string, any>
) => {
  const ctx = getEditedContextFromConfig(config);
  const pageDefinition = config.pages[containerInfo.name];
  const page = {
    ...pageDefinition,
    commands: pageDefinition.commands.map((command) => ({
      // @ts-expect-error TS2698: Spread types may only be created from object types.
      ...command,
      position:
        // @ts-expect-error TS2322: Type CommandComponent is not assignable to type object
        'command' in command &&
        additionalData &&
        additionalData.command === command.command
          ? buttonPosition
          : // @ts-expect-error TS2322: Type CommandComponent is not assignable to type object
          'position' in command
          ? command.position
          : null,
    })),
  };

  dispatch({
    ctx,
    type: 'ADD_PAGE',
    page,
    name: containerInfo.name,
  });
};

export default updatePageButtonPosition;
