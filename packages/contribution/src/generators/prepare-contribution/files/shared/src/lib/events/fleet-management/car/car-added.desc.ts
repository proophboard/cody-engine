import {AggregateEventDescription} from "@event-engine/descriptions/descriptions";

export const CarAddedDesc: AggregateEventDescription = {
  name: 'FleetManagement.Car.CarAdded',
  aggregateEvent: true,
  public: false,
  aggregateState: "FleetManagement.Car.Car",
  aggregateName: "FleetManagement.Car",
  aggregateIdentifier: "vehicleId",
  _pbBoardId: "ba59fb19-4d03-46fe-82a2-2725d61481ae",
  _pbCardId: "ncEudogeZ727TUbtRbbT4W",
  _pbCreatedBy: "a35267cd-dfd0-410f-b64a-7163fd150352",
  _pbCreatedAt: "2023-05-15T18:35:34.534Z",
  _pbLastUpdatedBy: "a35267cd-dfd0-410f-b64a-7163fd150352",
  _pbLastUpdatedAt: "2023-05-16T22:04:18.830Z",
  _pbVersion: 4,
  _pbLink: "https://app.prooph-board.com/inspectio/board/ba59fb19-4d03-46fe-82a2-2725d61481ae?cells=ncEudogeZ727TUbtRbbT4W&amp;clicks=1",
};
