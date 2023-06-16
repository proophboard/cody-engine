import {AggregateEventDescription} from "@event-engine/descriptions/descriptions";

export const CarUpdatedDesc: AggregateEventDescription = {
  name: 'FleetManagement.Car.CarUpdated',
  aggregateEvent: true,
  public: false,
  aggregateState: "FleetManagement.Car.Car",
  aggregateName: "FleetManagement.Car",
  aggregateIdentifier: "vehicleId",
  _pbBoardId: "ba59fb19-4d03-46fe-82a2-2725d61481ae",
  _pbCardId: "uZgBVGhFKgjPHhd7qNbGUE",
  _pbCreatedBy: "a35267cd-dfd0-410f-b64a-7163fd150352",
  _pbCreatedAt: "2023-05-10T20:41:04.076Z",
  _pbLastUpdatedBy: "a35267cd-dfd0-410f-b64a-7163fd150352",
  _pbLastUpdatedAt: "2023-05-10T20:50:01.025Z",
  _pbVersion: 2,
  _pbLink: "https://app.prooph-board.com/inspectio/board/ba59fb19-4d03-46fe-82a2-2725d61481ae?cells=uZgBVGhFKgjPHhd7qNbGUE&amp;clicks=1",
};
