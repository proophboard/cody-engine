import * as React from 'react';
import { useContext, useEffect } from 'react';
import { FormJexlContext } from '@frontend/app/components/core/form/types/form-jexl-context';
import {
  Action,
  ActionContainerInfo,
  ButtonPosition,
  getActionButtonName,
  getActionId, isButtonAction,
  FormAction as FormActionType
} from '@frontend/app/components/core/form/types/action';
import Grid2 from '@mui/material/Unstable_Grid2';
import ActionButton from '@frontend/app/components/core/ActionButton';
import { SxProps, useTheme } from '@mui/material';
import { useEnv } from '@frontend/hooks/use-env';
import { parseActionsFromUiOptions } from '@frontend/app/components/core/form/types/parse-actions';
import { RuntimeEnvironment } from '@frontend/app/providers/runtime-environment';
import { LiveEditModeContext } from '@cody-play/app/layout/PlayToggleLiveEditMode';
import PlayDroppable from '@cody-play/app/components/core/PlayDroppable';
import { DragAndDropContext } from '@cody-play/app/providers/DragAndDrop';
import { configStore } from '@cody-play/state/config-store';
import PlayDraggable from '@cody-play/app/components/core/PlayDraggable';
import {
  EDropzoneId,
  MAP_DROPZONE_POSITION_TO_DROPZONE_ID,
  MAP_POSITION_TO_DROPZONE_ID,
} from '@cody-play/app/types/enums/EDropzoneId';
import moveButtonPosition from '@cody-play/infrastructure/vibe-cody/utils/move-button-position';
import updatePageButtonPosition from '@cody-play/infrastructure/vibe-cody/utils/update-page-button-position';
import updateViewButtonPosition from '@cody-play/infrastructure/vibe-cody/utils/update-view-button-position';
import {FocusedButton} from "@cody-play/state/focused-element";
import FormAction from "@frontend/app/components/core/FormAction";

interface OwnProps {
  uiOptions: Record<string, any>;
  defaultService: string;
  jexlCtx: FormJexlContext;
  sx?: SxProps;
  actions?: Action[];
  additionalLeftButtons?: JSX.Element[];
  additionalCenterButtons?: JSX.Element[];
  additionalRightButtons?: JSX.Element[];
  containerInfo?: ActionContainerInfo;
  dropzoneId?: { left: EDropzoneId; center: EDropzoneId; right: EDropzoneId };
  showDropzone?: { left: boolean; center: boolean; right: boolean };
}

type BottomActionsProps = OwnProps;

export const getBottomActions = (
  uiOptions: Record<string, any>,
  jexlCtx: FormJexlContext,
  env: RuntimeEnvironment
): Action[] => {
  return parseActionsFromUiOptions(uiOptions, jexlCtx, env).filter((a) =>
    ['bottom-left', 'bottom-center', 'bottom-right'].includes(a.position)
  );
};

let keyVersion = 0;

const BottomActions = (props: BottomActionsProps) => {
  const theme = useTheme();
  const env = useEnv();
  const { liveEditMode } = useContext(LiveEditModeContext);
  const { dndEvent, setTransformValue } = useContext(DragAndDropContext);
  const { config, dispatch } = useContext(configStore);
  const isDragDropEnabled =
    liveEditMode && env.UI_ENV === 'play' && props.containerInfo !== undefined;
  const actions =
    props.actions || getBottomActions(props.uiOptions, props.jexlCtx, env);

  const leftActions = actions.filter((a) => a.position === 'bottom-left');
  const additionalLeftButtons = props.additionalLeftButtons || [];
  const centerActions = actions.filter((a) => a.position === 'bottom-center');
  const additionalCenterButtons = props.additionalCenterButtons || [];
  const rightActions = actions.filter((a) => a.position === 'bottom-right');
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

      // handle only the dropped elements in the bottom actions
      if (
        dropzonePosition !== 'view-bottom' &&
        dropzonePosition !== 'command-bottom' &&
        dropzonePosition !== 'page-bottom'
      ) {
        return;
      }

      // button was moved inside table view
      if (
        prevContainerInfoType === 'view' &&
        dropzonePosition === 'view-bottom' &&
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

      // button was moved inside page view
      if (
        prevContainerInfoType === 'page' &&
        dropzonePosition === 'page-bottom' &&
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

      // button was moved from page view to table view or vice versa
      if (
        (prevContainerInfoType === 'view' &&
          dropzonePosition === 'page-bottom' &&
          containerInfo.type === 'page') ||
        (prevContainerInfoType === 'page' &&
          dropzonePosition === 'view-bottom' &&
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

  if (
    !actions.length &&
    !additionalLeftButtons.length &&
    !additionalCenterButtons.length &&
    !additionalRightButtons.length &&
    !isDragDropEnabled
  ) {
    return <></>;
  }

  keyVersion++;

  return (
    <Grid2
      container
      sx={{ ...props.sx, gap: isDragDropEnabled ? theme.spacing(2) : null }}
    >
      {(leftActions.length > 0 ||
        additionalLeftButtons.length > 0 ||
        // If center and right buttons are given, we need the left placeholder so that center buttons are really centered
        (centerActions.length + additionalCenterButtons.length > 0 &&
          rightActions.length + additionalRightButtons.length > 0) ||
        isDragDropEnabled) && (
        <Grid2
          xs
          display="flex"
          direction="column"
          alignItems="center"
          justifyContent="flex-start"
          sx={{
            '& .MuiButton-root ~.MuiButton-root': {
              marginLeft: (theme) => theme.spacing(1),
            },
          }}
        >
          <PlayDroppable
            id={props.dropzoneId?.left ?? ('' as EDropzoneId)}
            isDragDropEnabled={isDragDropEnabled && !!props.showDropzone?.left}
          >
            {leftActions.map((action, index) => (
              <PlayDraggable
                key={`left_action_${keyVersion}_${index}`}
                id={`${props.containerInfo?.type}-bottom-actions-left-action-button-${index}`}
                isDragDropEnabled={isDragDropEnabled}
                focusableElement={{
                  id: getActionId(action),
                  name: getActionButtonName(action),
                  type: isButtonAction(action) ? 'button' : 'formAction',
                  action,
                  containerInfo: props.containerInfo!,
                } as FocusedButton}
                data={{
                  action,
                  prevContainerInfo: props.containerInfo,
                }}
              >
                {isButtonAction(action) ? <ActionButton
                  action={action}
                  defaultService={props.defaultService}
                  jexlCtx={props.jexlCtx}
                /> : <FormAction action={action as FormActionType} defaultService={props.defaultService} jexlCtx={props.jexlCtx} />}
              </PlayDraggable>
            ))}
            {props.additionalLeftButtons}
          </PlayDroppable>
        </Grid2>
      )}
      {(centerActions.length > 0 ||
        additionalCenterButtons.length > 0 ||
        isDragDropEnabled) && (
        <Grid2
          xs
          display="flex"
          direction="column"
          alignItems="center"
          justifyContent="center"
          sx={{
            '& .MuiButton-root ~.MuiButton-root': {
              marginLeft: (theme) => theme.spacing(1),
            },
          }}
        >
          <PlayDroppable
            id={props.dropzoneId?.center ?? ('' as EDropzoneId)}
            isDragDropEnabled={
              isDragDropEnabled && !!props.showDropzone?.center
            }
            contentPosition="center"
          >
            {centerActions.map((action, index) => (
              <PlayDraggable
                key={`center_action_${keyVersion}_${index}`}
                id={`${props.containerInfo?.type}-bottom-actions-center-action-button-${index}`}
                isDragDropEnabled={isDragDropEnabled}
                focusableElement={{
                  id: getActionId(action),
                  name: getActionButtonName(action),
                  type: isButtonAction(action) ? 'button' : 'formAction',
                  action,
                  containerInfo: props.containerInfo!,
                } as FocusedButton}
                data={{
                  action,
                  prevContainerInfo: props.containerInfo,
                }}
              >
                {isButtonAction(action) ? <ActionButton
                  action={action}
                  defaultService={props.defaultService}
                  jexlCtx={props.jexlCtx}
                /> : <FormAction action={action as FormActionType} defaultService={props.defaultService} jexlCtx={props.jexlCtx} />}
              </PlayDraggable>
            ))}
            {props.additionalCenterButtons}
          </PlayDroppable>
        </Grid2>
      )}
      {(rightActions.length > 0 ||
        additionalRightButtons.length > 0 ||
        // If center and left buttons are given, we need the right placeholder so that center buttons are really centered
        (centerActions.length + additionalCenterButtons.length > 0 &&
          leftActions.length + additionalLeftButtons.length > 0) ||
        isDragDropEnabled) && (
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
            id={props.dropzoneId?.right ?? ('' as EDropzoneId)}
            isDragDropEnabled={isDragDropEnabled && !!props.showDropzone?.right}
            contentPosition="right"
          >
            {rightActions.map((action, index) => (
              <PlayDraggable
                key={`right_action_${keyVersion}_${index}`}
                id={`${props.containerInfo?.type}-bottom-actions-right-action-button-${index}`}
                isDragDropEnabled={isDragDropEnabled}
                focusableElement={{
                  id: getActionId(action),
                  name: getActionButtonName(action),
                  type: isButtonAction(action) ? 'button' : 'formAction',
                  action,
                  containerInfo: props.containerInfo!,
                } as FocusedButton}
                data={{
                  action,
                  prevContainerInfo: props.containerInfo,
                }}
              >
                {isButtonAction(action) ? <ActionButton
                  action={action}
                  defaultService={props.defaultService}
                  jexlCtx={props.jexlCtx}
                /> : <FormAction action={action as FormActionType} defaultService={props.defaultService} jexlCtx={props.jexlCtx} />}
              </PlayDraggable>
            ))}
            {props.additionalRightButtons}
          </PlayDroppable>
        </Grid2>
      )}
    </Grid2>
  );
};

export default BottomActions;
