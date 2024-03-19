import * as React from 'react';
import {
  Alert,
  Button, CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  SxProps,
  useTheme
} from "@mui/material";
import {CommandRuntimeInfo} from "@event-engine/messaging/command";
import {Field, Widget} from "@rjsf/utils";
import {useRef, useState} from "react";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import {UseMutateAsyncFunction, useQueryClient} from "@tanstack/react-query";
import {commandTitle} from "@frontend/app/components/core/CommandButton";
import {useSnackbar} from "notistack";
import {Close, Send} from "mdi-material-ui";
import CommandForm from "@frontend/app/components/core/CommandForm";
import {AxiosResponse} from "axios";
import {useLocation, useNavigate, useParams} from "react-router-dom";
import {isAggregateCommandDescription} from "@event-engine/descriptions/descriptions";
import {DeepReadonly} from "json-schema-to-ts/lib/types/type-utils/readonly";
import {JSONSchema7} from "json-schema";
import definitions from "@app/shared/types/definitions";

export interface AggregateIdentifier {
  identifier: string;
  value: string;
}

export interface ButtonConfig {
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | undefined;
  style?: SxProps | undefined;
  variant?: "text" | "outlined" | "contained";
  startIcon?: React.ReactNode | undefined;
}

interface OwnProps {
  open: boolean;
  onClose: () => void;
  commandDialogCommand: CommandRuntimeInfo;
  commandFn?: UseMutateAsyncFunction<AxiosResponse, unknown, any>;
  incompleteCommandConfigError?: string;
  definitions?: {[id: string]: DeepReadonly<JSONSchema7>};
  aggregateIdentifier?: AggregateIdentifier;
  aggregateState?: {[stateKey: string]: any};
  initialValues?: {[prop: string]: any};
  button?: ButtonConfig;
  widgets?: {[name: string]: Widget};
  fields?: {[name: string]: Field};
  onBeforeSubmitting?: (formData: {[prop: string]: any}) => {[prop: string]: any};
}

type CommandDialogProps = OwnProps;

export interface TransactionState {
  isSubmitting: boolean;
  isSubmitted: boolean;
  isError: boolean;
  isValidationError: boolean;
}

const defaultTransactionState: TransactionState = {
  isSubmitting: false,
  isSubmitted: false,
  isError: false,
  isValidationError: false,
}

const CommandDialog = (props: CommandDialogProps) => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const snackbar = useSnackbar();
  const routeParams = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const commandFormRef = useRef<{submit: () => void}>();
  const [transactionState, setTransactionState] = useState<TransactionState>({...defaultTransactionState});
  const [tryAgain, setTryAgain] = useState(false);

  const filteredRouteParams: Record<string, string> = {};

  if(routeParams) {
    for (const routeParamKey in routeParams) {
      if(props.commandDialogCommand.schema.properties
        && Object.keys(props.commandDialogCommand.schema.properties).includes(routeParamKey)) {
        filteredRouteParams[routeParamKey] = routeParams[routeParamKey] as string;
      }
    }
  }

  const formData: {[prop: string]: any} = {...filteredRouteParams, ...props.initialValues};

  if(props.aggregateIdentifier) {
    formData[props.aggregateIdentifier.identifier] = props.aggregateIdentifier.value;
  }

  if(props.aggregateState) {
    for(const stateKey of Object.keys(props.aggregateState)) {
      if(props.commandDialogCommand.schema.properties
        && Object.keys(props.commandDialogCommand.schema.properties).includes(stateKey)) {
        formData[stateKey] = cloneDeepJSON(props.aggregateState[stateKey]);
      }
    }
  }

  const handleCancel = () => {
    setTransactionState({...defaultTransactionState})
    props.onClose();
  }

  const handleExecuteCommand = () => {
    if(transactionState.isError) {
      setTransactionState({...defaultTransactionState})
      setTryAgain(true);
      return;
    }

    if(transactionState.isSubmitted) {
      setTransactionState({...defaultTransactionState})
      props.onClose();
      return;
    }

    if(commandFormRef.current) {
      if(tryAgain) {
        setTryAgain(false);
      }

      commandFormRef.current.submit();
    }
  };

  const handleResponseReceived = () => {
    setTransactionState({...defaultTransactionState});
    snackbar.enqueueSnackbar(commandTitle(props.commandDialogCommand) + ' was successful', {variant: "success"});
    if(!isAggregateCommandDescription(props.commandDialogCommand.desc) || !props.commandDialogCommand.desc.deleteState) {
      queryClient.invalidateQueries();
    }
    window.setTimeout(() => {
      props.onClose();

      if(isAggregateCommandDescription(props.commandDialogCommand.desc) && props.commandDialogCommand.desc.deleteState) {
        const routeParts = location.pathname.split("/");
        const filteredRouteParts: string[] = [];
        let identifierPartMatched = false;
        const aggregateId = props.aggregateIdentifier ? props.aggregateIdentifier.value : props.aggregateState ? props.aggregateState[props.commandDialogCommand.desc.aggregateIdentifier] : '';

        routeParts.forEach(p => {
          if(identifierPartMatched) {
            return;
          }

          if(p === aggregateId) {
            identifierPartMatched = true;
          } else {
            filteredRouteParts.push(p);
          }
        })

        if(filteredRouteParts.length < 2) {
          filteredRouteParts.push("");
        }
        navigate(filteredRouteParts.join("/"));
      }
    }, 10);
  }
  return (
    <Dialog open={props.open} fullWidth={true} maxWidth={'lg'} onClose={handleCancel} sx={{"& .MuiDialog-paper": {minHeight: "50%"}}}>
      <DialogTitle>
        <IconButton sx={{
          position: 'absolute',
          right: theme.spacing(1),
          top: theme.spacing(0.5),
          color: theme.palette.grey[500],
        }} onClick={handleCancel}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ padding: '24px 24px' }}>
        <CommandForm
          command={props.commandDialogCommand}
          commandFn={props.commandFn}
          definitions={props.definitions || definitions}
          ref={commandFormRef}
          onBeforeSubmitting={(formData: {[prop: string]: any}) => {
            setTransactionState({...defaultTransactionState, isSubmitting: true})
            if(props.onBeforeSubmitting) {
              formData = props.onBeforeSubmitting(formData);
            }
            return formData;
          }}
          onResponseReceived={handleResponseReceived}
          onBackendErrorReceived={() => setTransactionState({...defaultTransactionState, isError: true, isSubmitted: true})}
          onValidationError={() => setTransactionState({...defaultTransactionState, isValidationError: true})}
          onChange={() => {
            if(transactionState.isValidationError) {
              setTransactionState({...defaultTransactionState})
            }
          }}
          formData={formData}
          widgets={props.widgets}
          fields={props.fields}
          tryAgain={tryAgain}
        />
      </DialogContent>
      <DialogActions>
        {transactionState.isValidationError && <Alert severity="error">Validation failed! Please check your inputs.</Alert>}
        {props.commandFn && <Button
          children={transactionState.isSubmitted ? 'Close' : 'Cancel'}
          onClick={handleCancel}
          color={'secondary'}
        />}
        {props.commandFn && <Button
          variant={props.button?.variant || 'contained'}
          color={props.button?.color || 'primary'}
          startIcon={transactionState.isSubmitting ? <CircularProgress size={20}/> : props.button?.startIcon || <Send/>}
          sx={{textTransform: 'none', margin: '5px', ...props.button?.style}}
          onClick={handleExecuteCommand}
          disabled={transactionState.isSubmitting}
        >
          {transactionState.isError ? 'Try again' : commandTitle(props.commandDialogCommand)}
        </Button>}
        {!props.commandFn && !props.incompleteCommandConfigError && <Alert severity="warning">Cannot process the command. It is not connected to an event that results in a state change (state = Information with identifier). Please check your prooph board configuration.</Alert>}
        {!props.commandFn && props.incompleteCommandConfigError && <Alert severity="error">{props.incompleteCommandConfigError}</Alert>}
      </DialogActions>
    </Dialog>
  );
};

export default CommandDialog;
