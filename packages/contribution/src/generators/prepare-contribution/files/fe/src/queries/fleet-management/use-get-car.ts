import {Api} from "@frontend/api";
import {AxiosResponse} from "axios";
import {useQuery} from "@tanstack/react-query";
import {QueryError} from "@frontend/queries/error/query-error";
import {GetCar} from "@app/shared/queries/fleet-management/get-car";
import {GetCarDesc} from "@app/shared/queries/fleet-management/get-car.desc";
import {Car} from "@app/shared/types/fleet-management/car/car";

export const getCar = async (params: GetCar): Promise<Car> => {
  const response: AxiosResponse<Car> = await Api.executeQuery(GetCarDesc.name, params);

  if(response.status === 200) {
    return response.data;
  }

  return Promise.reject(new QueryError(GetCarDesc.name));
}

export const useGetCar = (params: GetCar) => {
  return useQuery({
    queryKey: [GetCarDesc.name, params],
    queryFn: (): Promise<Car> => {
      return getCar(params);
    }
  })
}
