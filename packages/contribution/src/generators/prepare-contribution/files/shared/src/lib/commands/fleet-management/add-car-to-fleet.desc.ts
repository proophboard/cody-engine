import {AggregateCommandDescription} from "@event-engine/descriptions/descriptions";

export const AddCarToFleetDesc: AggregateCommandDescription = {
  name: 'FleetManagement.AddCarToFleet',
  aggregateCommand: true,
  newAggregate: true,
  aggregateName: "FleetManagement.Car",
  aggregateIdentifier: "vehicleId",
  _pbBoardId: "ba59fb19-4d03-46fe-82a2-2725d61481ae",
  _pbCardId: "769vcgTup1x237QkfaD92U",
  _pbCreatedBy: "a35267cd-dfd0-410f-b64a-7163fd150352",
  _pbCreatedAt: "2023-04-12T08:05:00+00",
  _pbLastUpdatedBy: "a35267cd-dfd0-410f-b64a-7163fd150352",
  _pbLastUpdatedAt: "2023-04-12T08:05:00+00",
  _pbVersion: 1,
  _pbLink: "https://app.prooph-board.com/inspectio/board/ba59fb19-4d03-46fe-82a2-2725d61481ae?cells=769vcgTup1x237QkfaD92U&clicks=1"
};
