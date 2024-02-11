import {AggregateRepository} from "@event-engine/infrastructure/AggregateRepository";
import fleetManagementCarRepository from "@server/repositories/fleet-management/car/repository";

type RepositoryRegistry = {[aggregateName: string]: () => AggregateRepository<any>};

export const repositories: RepositoryRegistry = {
  "FleetManagement.Car": fleetManagementCarRepository,
}
