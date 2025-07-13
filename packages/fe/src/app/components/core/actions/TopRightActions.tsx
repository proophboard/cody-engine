import * as React from 'react';
import { useContext, useEffect } from 'react';
import {
  Action,
  ActionContainerInfo,
  ButtonPosition,
  getActionButtonName,
  getActionId,
} from '@frontend/app/components/core/form/types/action';
import { FormJexlContext } from '@frontend/app/components/core/form/types/form-jexl-context';
import Grid2 from '@mui/material/Unstable_Grid2';
import ActionButton from '@frontend/app/components/core/ActionButton';
import { useEnv } from '@frontend/hooks/use-env';
import { parseActionsFromUiOptions } from '@frontend/app/components/core/form/types/parse-actions';
import { RuntimeEnvironment } from '@frontend/app/providers/runtime-environment';
import { LiveEditModeContext } from '@cody-play/app/layout/PlayToggleLiveEditMode';
import PlayDraggable from '@cody-play/app/components/core/PlayDraggable';
import PlayDroppable from '@cody-play/app/components/core/PlayDroppable';
import {
  EDropzoneId,
  MAP_DROPZONE_POSITION_TO_DROPZONE_ID,
  MAP_POSITION_TO_DROPZONE_ID,
} from '@cody-play/app/types/enums/EDropzoneId';
import { DragAndDropContext } from '@cody-play/app/providers/DragAndDrop';
import { configStore } from '@cody-play/state/config-store';
import { FocusedButton } from '@cody-play/state/focused-element';
import moveButtonPosition from '@cody-play/infrastructure/vibe-cody/utils/move-button-position';
import updatePageButtonPosition from '@cody-play/infrastructure/vibe-cody/utils/update-page-button-position';
import updateViewButtonPosition from '@cody-play/infrastructure/vibe-cody/utils/update-view-button-position';

interface OwnProps {
  uiOptions: Record<string, any>;
  defaultService: string;
  jexlCtx: FormJexlContext;
  actions?: Action[];
  additionalRightButtons?: JSX.Element[];
  containerInfo?: ActionContainerInfo;
  dropzoneId?: EDropzoneId;
  showDropzone?: boolean;
}

type TopRightActionsProps = OwnProps;

const getTopRightActionsFromUIOptions = (
  uiOptions: Record<string, any>,
  jexlCtx: FormJexlContext,
  env: RuntimeEnvironment
): Action[] => {
  return parseActionsFromUiOptions(uiOptions, jexlCtx, env).filter(
    (a) => a.position === 'top-right'
  );
};

const TopRightActions = (props: TopRightActionsProps) => {
  const env = useEnv();
  const { liveEditMode } = useContext(LiveEditModeContext);
  const { dndEvent, setTransformValue } = useContext(DragAndDropContext);
  const { config, dispatch } = useContext(configStore);
  const isDragDropEnabled =
    liveEditMode && env.UI_ENV === 'play' && props.containerInfo !== undefined;
  const actions =
    props.actions ||
    getTopRightActionsFromUIOptions(props.uiOptions, props.jexlCtx, env);

  const additionalRightButtons = props.additionalRightButtons || [];

  useEffect(() => {
    if (dndEvent) {
      const { over, active } = dndEvent;
      const { containerInfo } = props;

      if (!over || !containerInfo) {
        return;
      }

      const dropzonePosition =
        MAP_DROPZONE_POSITION_TO_DROPZONE_ID[over.id as string];
      const prevContainerInfoType = active.data.current?.prevContainerInfo.type;

      // handle only the dropped elements in the top actions
      if (dropzonePosition !== 'page-top' && dropzonePosition !== 'view-top' && dropzonePosition !== "command-top") {
        return;
      }

      // button was moved inside view
      if (
        prevContainerInfoType === 'view' &&
        dropzonePosition === 'view-top' &&
        containerInfo.type === 'view'
      ) {
        const buttonPosition = MAP_POSITION_TO_DROPZONE_ID[over.id as string];
        updateViewButtonPosition(
          config,
          dispatch,
          containerInfo,
          buttonPosition,
          active.data.current?.action
        );
        setTransformValue(null);
        return;
      }

      // button was moved inside page
      if (
        prevContainerInfoType === 'page' &&
        dropzonePosition === 'page-top' &&
        containerInfo.type === 'page'
      ) {
        const buttonPosition = MAP_POSITION_TO_DROPZONE_ID[over.id as string];
        updatePageButtonPosition(
          config,
          dispatch,
          containerInfo,
          buttonPosition as ButtonPosition,
          active.data.current?.action
        );
        setTransformValue(null);
        return;
      }

      // button was moved from page to view or vice versa
      if (
        (prevContainerInfoType === 'view' &&
          dropzonePosition === 'page-top' &&
          containerInfo.type === 'page') ||
        (prevContainerInfoType === 'page' &&
          dropzonePosition === 'view-top' &&
          containerInfo.type === 'view')
      ) {
        const buttonPosition = MAP_POSITION_TO_DROPZONE_ID[over.id as string];
        moveButtonPosition(
          config,
          dispatch,
          containerInfo,
          active.data.current?.prevContainerInfo,
          buttonPosition,
          active.data.current?.action
        );
        setTransformValue(null);
      }
    }
  }, [dndEvent]);

  if (!actions.length && !additionalRightButtons.length && !isDragDropEnabled) {
    return <></>;
  }

  return (
    <Grid2
      xs
      display="flex"
      direction="column"
      alignItems="center"
      justifyContent="flex-end"
      sx={{
        '& .MuiButton-root ~.MuiButton-root': {
          marginLeft: (theme) => theme.spacing(1),
        },
      }}
    >
      <PlayDroppable
        id={props.dropzoneId ?? ('' as EDropzoneId)}
        isDragDropEnabled={isDragDropEnabled && !!props.showDropzone}
        contentPosition="right"
      >
        {actions.map((action, index) => (
          <PlayDraggable
            key={`${props.containerInfo?.type}-action-button-${index}-key`}
            id={`${props.containerInfo?.type}-top-actions-action-button-${index}`}
            isDragDropEnabled={isDragDropEnabled}
            focusableElement={
              {
                id: getActionId(action),
                name: getActionButtonName(action),
                type: 'button',
                action,
                containerInfo: props.containerInfo!,
              } as FocusedButton
            }
            data={{
              action,
              prevContainerInfo: props.containerInfo,
            }}
          >
            <ActionButton
              action={action}
              defaultService={props.defaultService}
              jexlCtx={props.jexlCtx}
            />
          </PlayDraggable>
        ))}
        {props.additionalRightButtons}
      </PlayDroppable>
    </Grid2>
  );
};

export default TopRightActions;
