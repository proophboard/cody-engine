import {ValueObjectRuntimeInfo} from "@event-engine/messaging/value-object";
import {FleetManagementCarVORuntimeInfo} from "@app/shared/types/fleet-management/car/car";
import {FleetManagementCarListVORuntimeInfo} from "@app/shared/types/fleet-management/car/car-list";

type TypeRegistry = {[valueObjectName: string]: ValueObjectRuntimeInfo};

export const types: TypeRegistry = {
  "FleetManagement.Car.Car": FleetManagementCarVORuntimeInfo,
  "FleetManagement.Car.CarList": FleetManagementCarListVORuntimeInfo,
}
