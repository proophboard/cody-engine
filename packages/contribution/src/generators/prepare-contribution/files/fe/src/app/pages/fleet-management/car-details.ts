import {SubLevelPage} from "@frontend/app/pages/page-definitions";
import {GetCarDesc} from "@app/shared/queries/fleet-management/get-car.desc";
import {Car} from "@app/shared/types/fleet-management/car/car";
import {CarDesc} from "@app/shared/types/fleet-management/car/car.desc";
import {dynamicLabel} from "@frontend/util/breadcrumb/dynamic-label";
import {getCar} from "@frontend/queries/fleet-management/use-get-car";

export const CarDetails: SubLevelPage = {
  commands: [],
  components: ["FleetManagement.Car.Car"],
  topLevel: false,
  route: `/cars/:${CarDesc.identifier}`,
  routeParams: [CarDesc.identifier],
  breadcrumb: dynamicLabel(GetCarDesc.name, getCar, (car: Car) => car.brand + ' ' + car.model, "Car Details"),
}
