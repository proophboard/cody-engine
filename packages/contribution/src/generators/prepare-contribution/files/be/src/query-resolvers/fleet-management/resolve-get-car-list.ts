import {Query} from "@event-engine/messaging/query";
import {getConfiguredDocumentStore} from "@server/infrastructure/configuredDocumentStore";

import {GetCarList} from "@app/shared/queries/fleet-management/get-car-list";
import {carList, CarList} from "@app/shared/types/fleet-management/car/car-list";
import {CarListDesc} from "@app/shared/types/fleet-management/car/car-list.desc";
import {car, Car} from "@app/shared/types/fleet-management/car/car";
import {AnyFilter} from "@event-engine/infrastructure/DocumentStore/Filter/AnyFilter";
import {asyncIteratorToArray} from "@event-engine/infrastructure/helpers/async-iterator-to-array";
import {asyncMap} from "@event-engine/infrastructure/helpers/async-map";

export const resolveGetCarList = async (query: Query<GetCarList>): Promise<CarList> => {
  const ds = getConfiguredDocumentStore();

  const cursor = await ds.findDocs<Car>(
    CarListDesc.collection,
    new AnyFilter()
  );

  return asyncIteratorToArray(asyncMap(cursor, ([,d]) => car(d)));

}
