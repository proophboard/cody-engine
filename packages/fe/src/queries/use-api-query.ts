import {AxiosResponse} from "axios";
import {Api} from "@frontend/api";
import {QueryError} from "@frontend/queries/error/query-error";
import {useQuery, UseQueryOptions, UseQueryResult} from "@tanstack/react-query";

export type ApiQuery = (queryName: string, params: any) => Promise<any>;

const apiQuery: ApiQuery = async (queryName: string, params: any): Promise<any> => {
  const response: AxiosResponse = await Api.executeQuery(queryName, params);

  if(response.status === 200) {
    return response.data;
  }

  return Promise.reject(new QueryError(queryName));
}

let internalApiQuery: ApiQuery = apiQuery;

export const injectCustomApiQuery = (customApiQuery: ApiQuery): void => {
  internalApiQuery = customApiQuery;
}

export const getApiQuery = (): ApiQuery => {
  return internalApiQuery;
}

export const useApiQuery = (queryName: string, params: any, options?: {staleTime?: number}, disabled?: boolean) => {
  return useQuery({
    queryKey: [queryName, params],
    queryFn: () => {
      if(disabled) {
        return {};
      }

      return internalApiQuery(queryName, params);
    },
    ...options
  })
}
