import * as React from 'react';
import {
  Action,
  ActionContainerInfo,
} from '@frontend/app/components/core/form/types/action';
import { FormJexlContext } from '@frontend/app/components/core/form/types/form-jexl-context';
import Grid2 from '@mui/material/Unstable_Grid2';
import ActionButton from '@frontend/app/components/core/ActionButton';
import { useEnv } from '@frontend/hooks/use-env';
import { parseActionsFromUiOptions } from '@frontend/app/components/core/form/types/parse-actions';
import { RuntimeEnvironment } from '@frontend/app/providers/runtime-environment';
import { useContext } from 'react';
import { LiveEditModeContext } from '@cody-play/app/layout/PlayToggleLiveEditMode';
import PlayDraggable from '@cody-play/app/components/core/PlayDraggable';
import PlayDroppable from '@cody-play/app/components/core/PlayDroppable';
import { EDropzoneId } from '@cody-play/app/types/enums/EDropzoneId';

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
  const isDragDropEnabled =
    liveEditMode && env.UI_ENV === 'play' && props.containerInfo !== undefined;
  const actions =
    props.actions ||
    getTopRightActionsFromUIOptions(props.uiOptions, props.jexlCtx, env);

  const additionalRightButtons = props.additionalRightButtons || [];

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
          // TODO add data
          <PlayDraggable
            key={`action-button-${index}-key`}
            id={`top-actions-action-button-${index}`}
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
  );
};

export default TopRightActions;
