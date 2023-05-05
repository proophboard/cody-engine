import {AggregateDescription} from "@event-engine/infrastructure/AggregateDescription";
import {FleetManagementCarAggregateDesc} from "@app/shared/aggregates/fleet-management/car.desc";

type AggregateRegistry = {[aggregateName: string]: AggregateDescription};

export const aggregates: AggregateRegistry = {
  "FleetManagement.Car": FleetManagementCarAggregateDesc,
}
