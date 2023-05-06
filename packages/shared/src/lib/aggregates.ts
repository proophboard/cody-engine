import {FleetManagementCarAggregateDesc} from "@app/shared/aggregates/fleet-management/car.desc";
import {AggregateDescription} from "@event-engine/descriptions/descriptions";

type AggregateRegistry = {[aggregateName: string]: AggregateDescription};

export const aggregates: AggregateRegistry = {
  "FleetManagement.Car": FleetManagementCarAggregateDesc,
}
