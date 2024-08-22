import * as React from 'react';
import {PlayInformationRuntimeInfo} from "@cody-play/state/types";
import {FormJexlContext} from "@frontend/app/components/core/form/types/form-jexl-context";
import {Action, parseActionsFromUiOptions} from "@frontend/app/components/core/form/types/action";
import Grid2 from "@mui/material/Unstable_Grid2";
import ActionButton from "@frontend/app/components/core/ActionButton";

interface OwnProps {
  uiOptions: Record<string, any>;
  information: PlayInformationRuntimeInfo;
  jexlCtx: FormJexlContext;
}

type BottomActionsProps = OwnProps;

const getBottomActions = (uiOptions: Record<string, any>, jexlCtx: FormJexlContext): Action[] => {
  return parseActionsFromUiOptions(uiOptions, jexlCtx).filter(a => ["bottom-left", "bottom-center", "bottom-right"].includes(a.position));
}

const BottomActions = (props: BottomActionsProps) => {
 const actions = getBottomActions(props.uiOptions, props.jexlCtx);

 if(!actions.length) {
   return <></>
 }

 return <Grid2 container>
   <Grid2 xs
          display="flex"
          direction="column"
          alignItems="center"
          justifyContent="flex-start"
   >
     {actions.filter(a => a.position === "bottom-left").map(action => <ActionButton action={action} information={props.information} jexlCtx={props.jexlCtx} />)}
   </Grid2>
   <Grid2 xs
          display="flex"
          direction="column"
          alignItems="center"
          justifyContent="center"
   >
     {actions.filter(a => a.position === "bottom-center").map(action => <ActionButton action={action} information={props.information} jexlCtx={props.jexlCtx} />)}
   </Grid2>
   <Grid2 xs
          display="flex"
          direction="column"
          alignItems="center"
          justifyContent="flex-end"
   >
     {actions.filter(a => a.position === "bottom-right").map(action => <ActionButton action={action} information={props.information} jexlCtx={props.jexlCtx} />)}
   </Grid2>
 </Grid2>
};

export default BottomActions;
