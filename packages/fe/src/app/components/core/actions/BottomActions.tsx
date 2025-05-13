import * as React from 'react';
import { useContext, useEffect } from 'react';
import { FormJexlContext } from '@frontend/app/components/core/form/types/form-jexl-context';
import {
  Action,
  ActionContainerInfo,
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
  const { dndEvent } = useContext(DragAndDropContext);
  const isDragDropEnabled =
    liveEditMode && env.UI_ENV === 'play' && props.containerInfo;
  const actions =
    props.actions || getBottomActions(props.uiOptions, props.jexlCtx, env);

  const leftActions = actions.filter((a) => a.position === 'bottom-left');
  const additionalLeftButtons = props.additionalLeftButtons || [];
  const centerActions = actions.filter((a) => a.position === 'bottom-center');
  const additionalCenterButtons = props.additionalCenterButtons || [];
  const rightActions = actions.filter((a) => a.position === 'bottom-right');
  const additionalRightButtons = props.additionalRightButtons || [];

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
      {/* TODO buttons should still be visible */}
      {isDragDropEnabled && (
        <>
          <Grid2 xs>
            <PlayDroppable id="bottom-actions-dropzone-left" />
          </Grid2>
          <Grid2 xs>
            <PlayDroppable id="bottom-actions-dropzone-center" />
          </Grid2>
          <Grid2 xs>
            <PlayDroppable id="bottom-actions-dropzone-right" />
          </Grid2>
        </>
      )}
      {!isDragDropEnabled &&
        (leftActions.length > 0 || additionalLeftButtons.length > 0) && (
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
            {leftActions.map((action, index) => (
              <ActionButton
                key={`left_action_${keyVersion}_${index}`}
                action={action}
                defaultService={props.defaultService}
                jexlCtx={props.jexlCtx}
              />
            ))}
            {props.additionalLeftButtons}
          </Grid2>
        )}
      {!isDragDropEnabled &&
        (centerActions.length > 0 || additionalCenterButtons.length > 0) && (
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
            {centerActions.map((action, index) => (
              <ActionButton
                key={`center_action_${keyVersion}_${index}`}
                action={action}
                defaultService={props.defaultService}
                jexlCtx={props.jexlCtx}
              />
            ))}
            {props.additionalCenterButtons}
          </Grid2>
        )}
      {!isDragDropEnabled &&
        (rightActions.length > 0 || additionalRightButtons.length > 0) && (
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
            {rightActions.map((action, index) => (
              <ActionButton
                key={`right_action_${keyVersion}_${index}`}
                action={action}
                defaultService={props.defaultService}
                jexlCtx={props.jexlCtx}
              />
            ))}
            {props.additionalRightButtons}
          </Grid2>
        )}
    </Grid2>
  );
};

export default BottomActions;
