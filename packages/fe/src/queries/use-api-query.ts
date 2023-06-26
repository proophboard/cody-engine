import {AxiosResponse} from "axios";
import {Api} from "@frontend/api";
import {QueryError} from "@frontend/queries/error/query-error";
import {useQuery} from "@tanstack/react-query";

export const apiQuery = async (queryName: string, params: any): Promise<any> => {
  const response: AxiosResponse = await Api.executeQuery(queryName, params);

  if(response.status === 200) {
    return response.data;
  }

  return Promise.reject(new QueryError(queryName));
}

export const useApiQuery = (queryName: string, params: any) => {
  return useQuery({
    queryKey: [queryName, params],
    queryFn: () => {
      return apiQuery(queryName, params);
    }
  })
}
