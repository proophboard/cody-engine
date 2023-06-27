import {SubLevelPageWithProophBoardDescription} from "@frontend/app/pages/page-definitions";
import {GetCarDesc} from "@app/shared/queries/fleet-management/get-car.desc";
import {Car} from "@app/shared/types/fleet-management/car/car";
import {CarDesc} from "@app/shared/types/fleet-management/car/car.desc";
import {dynamicLabel} from "@frontend/util/breadcrumb/dynamic-label";
import {getCar} from "@frontend/queries/fleet-management/use-get-car";

export const CarDetails: SubLevelPageWithProophBoardDescription = {
  commands: [],
  components: ["FleetManagement.Car"],
  topLevel: false,
  route: `/cars/:${CarDesc.identifier}`,
  routeParams: [CarDesc.identifier],
  breadcrumb: dynamicLabel(GetCarDesc.name, getCar, (car: Car) => car.brand + ' ' + car.model, "Car Details"),
  _pbBoardId: "ba59fb19-4d03-46fe-82a2-2725d61481ae",
  _pbCardId: "rMtAYVejJQZuuF7Q8SDkrF",
  _pbCreatedBy: "a35267cd-dfd0-410f-b64a-7163fd150352",
  _pbCreatedAt: "2023-04-12T08:05:00+00",
  _pbLastUpdatedBy: "a35267cd-dfd0-410f-b64a-7163fd150352",
  _pbLastUpdatedAt: "2023-04-12T08:05:00+00",
  _pbVersion: 1,
  _pbLink: "https://app.prooph-board.com/inspectio/board/ba59fb19-4d03-46fe-82a2-2725d61481ae?cells=rMtAYVejJQZuuF7Q8SDkrF&clicks=1"
}
