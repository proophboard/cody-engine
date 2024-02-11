import {Query} from "@event-engine/messaging/query";
import {getConfiguredDocumentStore} from "@server/infrastructure/configuredDocumentStore";
import {NotFoundError} from "@event-engine/messaging/error/not-found-error";
import {GetCar} from "@app/shared/queries/fleet-management/get-car";
import {car, Car} from "@app/shared/types/fleet-management/car/car";
import {CarDesc} from "@app/shared/types/fleet-management/car/car.desc";

export const resolveGetCar = async (query: Query<GetCar>): Promise<Car> => {
  const ds = getConfiguredDocumentStore();

  const doc = await ds.getDoc<Car>(CarDesc.collection, query.payload.vehicleId);

  if(!doc) {
    throw new NotFoundError(`Car with vehicleId: "${query.payload.vehicleId}" not found!`);
  }

  return car(doc);

}
