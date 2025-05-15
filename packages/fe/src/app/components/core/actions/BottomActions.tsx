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
import {
  configStore,
  getEditedContextFromConfig,
} from '@cody-play/state/config-store';
import { playDefinitionIdFromFQCN } from '@cody-play/infrastructure/cody/schema/play-definition-id';
import PlayDraggable from '@cody-play/app/components/core/PlayDraggable';
import { EDropzoneId } from '@cody-play/app/types/enums/EDropzoneId';

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
      const { over } = dndEvent;
      const { containerInfo } = props;

      if (!over || !containerInfo) {
        return;
      }

      if (containerInfo.type === 'view') {
        const { id } = over;
        const ctx = getEditedContextFromConfig(config);
        const informationRuntimeInfo = config.types[containerInfo.name];
        const uiOptions = informationRuntimeInfo.uiSchema?.['ui:options'];
        const uiOptionsActions = uiOptions
          ? (uiOptions.actions as object[])
          : undefined;
        const actions = uiOptionsActions
          ? uiOptionsActions.map((action) => ({
              ...action,
              position: 'bottom-right', // TODO get position depending on dropzone
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
            id={EDropzoneId.TABLE_BOTTOM_ACTIONS_LEFT}
            isDragDropEnabled={isDragDropEnabled}
          >
            {leftActions.map((action, index) => (
              <PlayDraggable
                key={`left_action_${keyVersion}_${index}`}
                id={`bottom-actions-left-action-button-${index}`}
                isDragDropEnabled={isDragDropEnabled}
              >
                <ActionButton
                  action={action}
                  defaultService={props.defaultService}
                  jexlCtx={props.jexlCtx}
                />
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
            id={EDropzoneId.TABLE_BOTTOM_ACTIONS_CENTER}
            isDragDropEnabled={isDragDropEnabled}
            contentPosition="center"
          >
            {centerActions.map((action, index) => (
              <PlayDraggable
                key={`center_action_${keyVersion}_${index}`}
                id={`bottom-actions-center-action-button-${index}`}
                isDragDropEnabled={isDragDropEnabled}
              >
                <ActionButton
                  action={action}
                  defaultService={props.defaultService}
                  jexlCtx={props.jexlCtx}
                />
              </PlayDraggable>
            ))}
            {props.additionalCenterButtons}
          </PlayDroppable>
        </Grid2>
      )}
      {(rightActions.length > 0 ||
        additionalRightButtons.length > 0 ||
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
            id={EDropzoneId.TABLE_BOTTOM_ACTIONS_RIGHT}
            isDragDropEnabled={isDragDropEnabled}
            contentPosition="right"
          >
            {rightActions.map((action, index) => (
              <PlayDraggable
                key={`right_action_${keyVersion}_${index}`}
                id={`bottom-actions-right-action-button-${index}`}
                isDragDropEnabled={isDragDropEnabled}
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
      )}
    </Grid2>
  );
};

export default BottomActions;
