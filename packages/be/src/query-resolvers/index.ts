import {QueryResolverRegistry} from "@event-engine/messaging/query";
import {resolveGetCar} from "@server/query-resolvers/fleet-management/resolve-get-car";

export const queryResolvers: QueryResolverRegistry = {
  "FleetManagement.GetCar": resolveGetCar,
}
