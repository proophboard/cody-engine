import * as React from 'react';
import {Action, parseActionsFromUiOptions} from "@frontend/app/components/core/form/types/action";
import {FormJexlContext} from "@frontend/app/components/core/form/types/form-jexl-context";
import Grid2 from "@mui/material/Unstable_Grid2";
import ActionButton from "@frontend/app/components/core/ActionButton";
import {RuntimeEnvironment} from "@frontend/app/providers/UseEnvironment";
import {useEnv} from "@frontend/hooks/use-env";

interface OwnProps {
  uiOptions: Record<string, any>;
  defaultService: string;
  jexlCtx: FormJexlContext;
  actions?: Action[];
  additionalRightButtons?: JSX.Element[];
}

type TopRightActionsProps = OwnProps;

const getTopRightActionsFromUIOptions = (uiOptions: Record<string, any>, jexlCtx: FormJexlContext, env: RuntimeEnvironment): Action[] => {
  return parseActionsFromUiOptions(uiOptions, jexlCtx, env).filter(a => a.position === "top-right");
}

const TopRightActions = (props: TopRightActionsProps) => {
  const env = useEnv();
  const actions = props.actions || getTopRightActionsFromUIOptions(props.uiOptions, props.jexlCtx, env);

  const additionalRightButtons = props.additionalRightButtons || [];

  if(!actions.length && !additionalRightButtons.length) {
    return <></>;
  }

  return <Grid2 xs
                display="flex"
                direction="column"
                alignItems="center"
                justifyContent="flex-end"
                sx={{
                  "& :not(:first-of-type)": {
                    marginLeft: (theme) => theme.spacing(1)
                  }
                }}
  >
    {actions.map(action => <ActionButton action={action} defaultService={props.defaultService} jexlCtx={props.jexlCtx} />)}
    {props.additionalRightButtons}
  </Grid2>
};

export default TopRightActions;
