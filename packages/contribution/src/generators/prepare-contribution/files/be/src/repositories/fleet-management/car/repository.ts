import {AggregateRepository} from "@event-engine/infrastructure/AggregateRepository";
import applyFunctions from "@server/event-reducers/fleet-management/car/index";
import {WRITE_MODEL_STREAM} from "@server/infrastructure/configuredEventStore";
import {getConfiguredMultiModelStore} from "@server/infrastructure/configuredMultiModelStore";
import {FleetManagementCarAggregateDesc} from "@app/shared/aggregates/fleet-management/car.desc";
import {Car, car} from "@app/shared/types/fleet-management/car/car";
import {eventReducerExtensions} from "@server/extensions/event-reducers";

const store = getConfiguredMultiModelStore();

const repository = new AggregateRepository<Car>(
  store,
  FleetManagementCarAggregateDesc.stream || WRITE_MODEL_STREAM,
  FleetManagementCarAggregateDesc.collection,
  FleetManagementCarAggregateDesc.name,
  FleetManagementCarAggregateDesc.identifier,
  {...applyFunctions, ...eventReducerExtensions},
  car
);

export default repository;
