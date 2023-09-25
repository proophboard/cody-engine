import {CodyResponse, CodyResponseType} from "@proophboard/cody-types";

export const playIsCodyError =(err: any): err is CodyResponse => {
  if(err && typeof err === 'object') {
    // eslint-disable-next-line no-prototype-builtins
    return err.hasOwnProperty('cody') && err.hasOwnProperty('type') && err.type === CodyResponseType.Error;
  }

  return false;
}

export const playIsCodyWarning =(warning: any): warning is CodyResponse => {
  if(warning && typeof warning === 'object') {
    // eslint-disable-next-line no-prototype-builtins
    return warning.hasOwnProperty('cody') && warning.hasOwnProperty('type') && warning.type === CodyResponseType.Warning;
  }

  return false;
}

export class CodyResponseException extends Error {
  public codyResponse: CodyResponse;

  constructor(error: CodyResponse) {
    super();
    this.codyResponse = error;
  }
}

export const playwithErrorCheck = <T extends (...args: any) => any>(func: T, args: Parameters<T>): Exclude<ReturnType<T>, CodyResponse> => {
  const res = func.apply(func, args);

  if(playIsCodyError(res)) {
    throw new CodyResponseException(res);
  }

  return res;
}

export const asyncPlayWithErrorCheck = async <T extends (...args: any) => Promise<any>>(func: T, args: Parameters<T>): Promise<Exclude<Awaited<ReturnType<T>>, CodyResponse>> => {
  const res = await func.apply(func, args);

  if(playIsCodyError(res)) {
    throw new CodyResponseException(res);
  }

  return res;
}
