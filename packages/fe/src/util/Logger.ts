
/* eslint-disable no-console */

export const Logger = {
    log: (...message: any[]) => console.log(...message),
    warn: (...message: any[]) => console.warn(...message),
    error: (...message: any[]) => console.error(...message),
};
