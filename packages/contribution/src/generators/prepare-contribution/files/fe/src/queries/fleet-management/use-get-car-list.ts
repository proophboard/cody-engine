import {CarList} from "@app/shared/types/fleet-management/car/car-list";
import {Api} from "@frontend/api";
import {GetCarListDesc} from "@app/shared/queries/fleet-management/get-car-list.desc";
import {GetCarList} from "@app/shared/queries/fleet-management/get-car-list";
import {AxiosResponse} from "axios";
import {useQuery} from "@tanstack/react-query";
import {QueryError} from "@frontend/queries/error/query-error";

const getCarList = async (params: GetCarList): Promise<CarList> => {
  const response: AxiosResponse<CarList> = await Api.executeQuery(GetCarListDesc.name, params);

  if(response.status === 200) {
    return response.data;
  }

  return Promise.reject(new QueryError(GetCarListDesc.name));
}

export const useGetCarList = (params: GetCarList) => {
  return useQuery({
    queryKey: [GetCarListDesc.name, params],
    queryFn: (): Promise<CarList> => {
      return getCarList(params);
    }
  })
}
