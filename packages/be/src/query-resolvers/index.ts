import { QueryResolverRegistry } from "@event-engine/messaging/query";
import { resolveGetCar as resolveFleetManagementGetCar } from "@server/query-resolvers/fleet-management/resolve-get-car";

export const queryResolvers: QueryResolverRegistry = {
  "FleetManagement.GetCar": resolveFleetManagementGetCar
}
