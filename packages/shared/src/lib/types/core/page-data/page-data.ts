import {UseQueryResult} from "@tanstack/react-query";

export type PageData = Record<string, UseQueryResult | unknown>;

export type AddQueryResultOrData = (name: string, result: UseQueryResult | unknown) => void;

export const isQueryResult = (result: unknown): result is UseQueryResult => {
  if(result && typeof result === "object") {
    // eslint-disable-next-line no-prototype-builtins
    if(result.hasOwnProperty('isFetched')) {
      return true;
    }
  }

  return false;
}
