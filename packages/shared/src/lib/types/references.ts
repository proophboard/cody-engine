import {CarListSchema as FleetManagementCarListSchema} from "@app/shared/types/fleet-management/car/car-list.schema";
import {CarSchema as FleetManagementCarSchema} from "@app/shared/types/fleet-management/car/car.schema";

export type references = [
  typeof FleetManagementCarListSchema,
  typeof FleetManagementCarSchema,
];
