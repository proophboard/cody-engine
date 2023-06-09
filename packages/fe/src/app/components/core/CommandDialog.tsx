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
import {Logger} from "@frontend/util/Logger";

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
  commandFn: UseMutateAsyncFunction<AxiosResponse, unknown, any>;
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
  const commandFormRef = useRef<{submit: () => void}>();
  const [transactionState, setTransactionState] = useState<TransactionState>({...defaultTransactionState});
  const [tryAgain, setTryAgain] = useState(false);
  const formData: {[prop: string]: any} = props.initialValues || {};

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
    queryClient.invalidateQueries();
    window.setTimeout(() => {
      props.onClose();
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
        {commandTitle(props.commandDialogCommand)}
      </DialogTitle>
      <DialogContent sx={{ padding: '24px 24px' }}>
        <CommandForm
          command={props.commandDialogCommand}
          commandFn={props.commandFn}
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
        <Button
          children={transactionState.isSubmitted? 'Close' : 'Cancel'}
          onClick={handleCancel}
          color={'secondary'}
        />
        <Button
          variant={props.button?.variant || 'contained'}
          color={props.button?.color || 'primary'}
          startIcon={transactionState.isSubmitting? <CircularProgress size={20} /> : props.button?.startIcon || <Send />}
          sx={{ textTransform: 'none', margin: '5px', ...props.button?.style }}
          onClick={handleExecuteCommand}
          disabled={transactionState.isSubmitting}
        >
          {transactionState.isError? 'Try again' : commandTitle(props.commandDialogCommand)}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CommandDialog;
