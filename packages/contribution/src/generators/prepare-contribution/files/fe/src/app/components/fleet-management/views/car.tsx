import {useGetCar} from "../../../../../../../../../../../fe/src/queries/fleet-management/use-get-car";
import {CircularProgress} from "@mui/material";
import StateView from "../../../../../../../../../../../fe/src/app/components/core/StateView";
import {FleetManagementCarCarVORuntimeInfo} from "@app/shared/types/fleet-management/car/car";

type CarProps = Record<string, string> & {vehicleId: string};

const Car = (props: CarProps) => {
  const query = useGetCar(props);

  return <>
    {query.isLoading && <CircularProgress />}
    {query.isSuccess && <StateView description={FleetManagementCarCarVORuntimeInfo} state={query.data} />}
  </>
}

export default Car;
