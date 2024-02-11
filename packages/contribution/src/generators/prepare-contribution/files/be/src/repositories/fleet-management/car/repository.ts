import {AggregateRepository} from "@event-engine/infrastructure/AggregateRepository";
import applyFunctions from "@server/event-reducers/fleet-management/car/index";
import {WRITE_MODEL_STREAM} from "@server/infrastructure/configuredEventStore";
import {getConfiguredMultiModelStore} from "@server/infrastructure/configuredMultiModelStore";
import {FleetManagementCarAggregateDesc} from "@app/shared/aggregates/fleet-management/car.desc";
import {Car, car} from "@app/shared/types/fleet-management/car/car";
import {eventReducerExtensions} from "@server/extensions/event-reducers";
import {getExternalServiceOrThrow} from "@server/extensions/get-external-service";
import {AuthService} from "@server/infrastructure/auth-service/auth-service";
import {
  INFORMATION_SERVICE_NAME,
  InformationService
} from "@server/infrastructure/information-service/information-service";
import {getConfiguredMessageBox} from "@server/infrastructure/configuredMessageBox";

let repository: AggregateRepository<Car>;

const factory = (): AggregateRepository<Car> => {
  if(!repository) {
    const store = getConfiguredMultiModelStore();
    const authService = getExternalServiceOrThrow<AuthService>('AuthService', {});
    const infoService = getExternalServiceOrThrow<InformationService>(INFORMATION_SERVICE_NAME, {});
    const messageBox = getConfiguredMessageBox();

    repository = new AggregateRepository<Car>(
      store,
      FleetManagementCarAggregateDesc.stream || WRITE_MODEL_STREAM,
      FleetManagementCarAggregateDesc.collection,
      FleetManagementCarAggregateDesc.name,
      FleetManagementCarAggregateDesc.identifier,
      {...applyFunctions, ...eventReducerExtensions},
      car,
      authService,
      infoService,
      messageBox
    );
  }

  return repository;
}


export default factory;
