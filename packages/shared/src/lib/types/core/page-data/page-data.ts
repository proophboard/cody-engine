import {UseQueryResult} from "@tanstack/react-query";
import {PageFormReference} from "@app/shared/types/core/page-form/page-form";

export type PageData = Record<string, UseQueryResult | PageFormReference | unknown>;

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

export const isPageFormReference = (result: any): result is PageFormReference => {
  if(result && typeof result === "object") {
    // eslint-disable-next-line no-prototype-builtins
    if(result.hasOwnProperty('getData') && typeof result.getData === "function") {
      return true;
    }
  }

  return false;
}
