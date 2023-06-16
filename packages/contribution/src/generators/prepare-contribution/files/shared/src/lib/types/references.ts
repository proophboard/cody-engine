import { CarSchema } from "@app/shared/types/fleet-management/car/car.schema";
import { CarListSchema as FleetManagementCarCarListSchema } from "@app/shared/types/fleet-management/car/car-list.schema";

export type references = [
  typeof CarSchema,
  typeof FleetManagementCarCarListSchema
];
