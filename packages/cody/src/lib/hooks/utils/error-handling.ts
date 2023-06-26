import {CodyResponse} from "@proophboard/cody-types";
import {isCodyError} from "@proophboard/cody-utils";

export class CodyResponseException extends Error {
  public codyResponse: CodyResponse;

  constructor(error: CodyResponse) {
    super();
    this.codyResponse = error;
  }
}

export const withErrorCheck = <T extends (...args: any) => any>(func: T, args: Parameters<T>): Exclude<ReturnType<T>, CodyResponse> => {
  const res = func.apply(func, args);

  if(isCodyError(res)) {
    throw new CodyResponseException(res);
  }

  return res;
}

export const asyncWithErrorCheck = async <T extends (...args: any) => Promise<any>>(func: T, args: Parameters<T>): Promise<Exclude<Awaited<ReturnType<T>>, CodyResponse>> => {
  const res = await func.apply(func, args);

  if(isCodyError(res)) {
    throw new CodyResponseException(res);
  }

  return res;
}
