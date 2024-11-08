import * as React from 'react';
import {Action, parseActionsFromUiOptions} from "@frontend/app/components/core/form/types/action";
import {FormJexlContext} from "@frontend/app/components/core/form/types/form-jexl-context";
import Grid2 from "@mui/material/Unstable_Grid2";
import ActionButton from "@frontend/app/components/core/ActionButton";

interface OwnProps {
  uiOptions: Record<string, any>;
  defaultService: string;
  jexlCtx: FormJexlContext;
}

type TopRightActionsProps = OwnProps;

const getTopRightActionsFromUIOptions = (uiOptions: Record<string, any>, jexlCtx: FormJexlContext): Action[] => {
  return parseActionsFromUiOptions(uiOptions, jexlCtx).filter(a => a.position === "top-right");
}

const TopRightActions = (props: TopRightActionsProps) => {
  const actions = getTopRightActionsFromUIOptions(props.uiOptions, props.jexlCtx);

  if(!actions.length) {
    return <></>;
  }

  return <Grid2 xs
                display="flex"
                direction="column"
                alignItems="center"
                justifyContent="flex-end"
  >{actions.map(action => <ActionButton action={action} defaultService={props.defaultService} jexlCtx={props.jexlCtx} />)}</Grid2>
};

export default TopRightActions;
