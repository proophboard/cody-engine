import { ValueObjectRuntimeInfo } from "@event-engine/messaging/value-object";
import { FleetManagementCarCarVORuntimeInfo } from "@app/shared/types/fleet-management/car/car";
import { FleetManagementCarCarListVORuntimeInfo } from "@app/shared/types/fleet-management/car/car-list";

type TypeRegistry = { [valueObjectName: string]: ValueObjectRuntimeInfo };

export const types: TypeRegistry = {
  "FleetManagement.Car.Car": FleetManagementCarCarVORuntimeInfo,
  "FleetManagement.Car.CarList": FleetManagementCarCarListVORuntimeInfo
}
