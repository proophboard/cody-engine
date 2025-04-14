import * as React from 'react';
import {FormJexlContext} from "@frontend/app/components/core/form/types/form-jexl-context";
import {Action, parseActionsFromUiOptions} from "@frontend/app/components/core/form/types/action";
import Grid2 from "@mui/material/Unstable_Grid2";
import ActionButton from "@frontend/app/components/core/ActionButton";
import {ButtonGroup, SxProps} from "@mui/material";
import {RuntimeEnvironment} from "@frontend/app/providers/UseEnvironment";
import {useEnv} from "@frontend/hooks/use-env";
import theme from "@frontend/extensions/app/layout/theme";

interface OwnProps {
  uiOptions: Record<string, any>;
  defaultService: string;
  jexlCtx: FormJexlContext;
  sx?: SxProps;
  actions?: Action[];
}

type BottomActionsProps = OwnProps;

export const getBottomActions = (uiOptions: Record<string, any>, jexlCtx: FormJexlContext, env: RuntimeEnvironment): Action[] => {
  return parseActionsFromUiOptions(uiOptions, jexlCtx, env).filter(a => ["bottom-left", "bottom-center", "bottom-right"].includes(a.position));
}

let keyVersion = 0;

const BottomActions = (props: BottomActionsProps) => {
 const env = useEnv();
 const actions = props.actions || getBottomActions(props.uiOptions, props.jexlCtx, env);

 const leftActions = actions.filter(a => a.position === "bottom-left");
 const centerActions = actions.filter(a => a.position === "bottom-center");
 const rightActions = actions.filter(a => a.position === "bottom-right");

 if(!actions.length) {
   return <></>
 }

 keyVersion++;

 return <Grid2 container sx={props.sx}>
   {leftActions.length > 0 && <Grid2 xs
           display="flex"
           direction="column"
           alignItems="center"
           justifyContent="flex-start"
           sx={{
             "& :not(:first-of-type)": {
               marginLeft: (theme) => theme.spacing(1)
             }
           }}
   >
     {leftActions.map((action, index) => <ActionButton key={`left_action_${keyVersion}_${index}`} action={action} defaultService={props.defaultService}
                                                           jexlCtx={props.jexlCtx}/>)}
   </Grid2>}
   {centerActions.length > 0 && <Grid2 xs
           display="flex"
           direction="column"
           alignItems="center"
           justifyContent="center"
           sx={{
             "& :not(:first-of-type)": {
               marginLeft: (theme) => theme.spacing(1)
             }
           }}
   >
     {centerActions.map((action, index) => <ActionButton key={`center_action_${keyVersion}_${index}`} action={action} defaultService={props.defaultService}
                                                jexlCtx={props.jexlCtx}/>)}
   </Grid2>}
   {rightActions.length > 0 && <Grid2 xs
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
     {rightActions.map((action, index) => <ActionButton key={`right_action_${keyVersion}_${index}`} action={action} defaultService={props.defaultService}
                                               jexlCtx={props.jexlCtx}/>)}
   </Grid2>}
 </Grid2>
};

export default BottomActions;
