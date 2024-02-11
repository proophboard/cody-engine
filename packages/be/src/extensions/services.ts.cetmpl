import {ServiceRegistry} from "@event-engine/infrastructure/ServiceRegistry";
import {authServiceFactory} from "@server/infrastructure/auth-service/auth-service-factory";
import {informationServiceFactory} from "@server/infrastructure/information-service/information-service-factory";
import {getConfiguredMessageBox} from "@server/infrastructure/configuredMessageBox";

export const services: ServiceRegistry = {
  'AuthService': authServiceFactory,
  // Default service that's always available when events are being handled. Used to update read models
  'CodyInformationService': informationServiceFactory,
};
