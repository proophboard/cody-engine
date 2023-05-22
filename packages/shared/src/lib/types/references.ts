import { CarListSchema } from "@app/shared/types/fleet-management/car/car-list.schema";
import { CarSchema } from "@app/shared/types/fleet-management/car/car.schema";

export type references = [
  typeof CarListSchema,
  typeof CarSchema,
];
