import {useGetCar} from "@frontend/queries/fleet-management/use-get-car";
import {CircularProgress} from "@mui/material";
import StateView from "@frontend/app/components/core/StateView";
import {FleetManagementCarCarVORuntimeInfo} from "@app/shared/types/fleet-management/car/car";

type CarProps = Record<string, string> & {vehicleId: string};

export const Car = (props: CarProps) => {
  const query = useGetCar(props);

  return <>
    {query.isLoading && <CircularProgress />}
    {query.isSuccess && <StateView description={FleetManagementCarCarVORuntimeInfo} state={query.data} />}
  </>
}
