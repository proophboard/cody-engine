
/* eslint-disable no-console */

import {enqueueSnackbar} from "notistack";
import {environment} from "@frontend/environments/environment";

export const Logger = {
    log: (...message: any[]) => console.log(...message),
    warn: (...message: any[]) => console.warn(...message),
    error: (...message: any[]) => {
        const firstMsg = message[0];

        if(firstMsg && firstMsg instanceof Error) {
            enqueueSnackbar(firstMsg.message, {variant: "error"});
        }

        console.error(...message)
    },
};

export const DevLogger = {
    log: (...message: any[]) => !environment.production && console.log(...message),
    warn: (...message: any[]) => console.warn(...message),
    error: (...message: any[]) => {
        const firstMsg = message[0];

        if(firstMsg && firstMsg instanceof Error) {
            enqueueSnackbar(firstMsg.message, {variant: "error"});
        }

        console.error(...message)
    },
}
