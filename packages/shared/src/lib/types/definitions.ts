import { CarListSchema } from "@app/shared/types/fleet-management/car/car-list.schema";
import { CarSchema } from "@app/shared/types/fleet-management/car/car.schema";

const definitions = {
  '/definitions/fleet-management/car/car-list': CarListSchema,
  '/definitions/fleet-management/car/car': CarSchema,
};

export default definitions;
