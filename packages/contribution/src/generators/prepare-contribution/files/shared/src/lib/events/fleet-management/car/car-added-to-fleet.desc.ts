import {AggregateEventDescription} from "@event-engine/descriptions/descriptions";

export const CarAddedToFleetDesc: AggregateEventDescription = {
  name: 'FleetManagement.Car.CarAddedToFleet',
  aggregateEvent: true,
  public: false,
  aggregateState: "FleetManagement.Car.Car",
  aggregateName: "FleetManagement.Car",
  aggregateIdentifier: "vehicleId",
  _pbBoardId: "ba59fb19-4d03-46fe-82a2-2725d61481ae",
  _pbCardId: "cQTvebiqthrzVnP4e1csvJ",
  _pbCreatedBy: "a35267cd-dfd0-410f-b64a-7163fd150352",
  _pbCreatedAt: "2023-04-12T08:05:00+00",
  _pbLastUpdatedBy: "a35267cd-dfd0-410f-b64a-7163fd150352",
  _pbLastUpdatedAt: "2023-05-15T20:15:39.078Z",
  _pbVersion: 3,
  _pbLink: "https://app.prooph-board.com/inspectio/board/ba59fb19-4d03-46fe-82a2-2725d61481ae?cells=cQTvebiqthrzVnP4e1csvJ&amp;clicks=1",
};
