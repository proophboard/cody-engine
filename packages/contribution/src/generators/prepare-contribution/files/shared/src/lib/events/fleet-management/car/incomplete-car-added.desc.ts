import {AggregateEventDescription} from "@event-engine/descriptions/descriptions";

export const IncompleteCarAddedDesc: AggregateEventDescription = {
  name: 'FleetManagement.Car.IncompleteCarAdded',
  aggregateEvent: true,
  public: false,
  aggregateState: "FleetManagement.Car.Car",
  aggregateName: "FleetManagement.Car",
  aggregateIdentifier: "vehicleId",
  _pbBoardId: "ba59fb19-4d03-46fe-82a2-2725d61481ae",
  _pbCardId: "riXgLkFo1Vdy5tF387JJ7y",
  _pbCreatedBy: "a35267cd-dfd0-410f-b64a-7163fd150352",
  _pbCreatedAt: "2023-05-15T18:31:10.498Z",
  _pbLastUpdatedBy: "a35267cd-dfd0-410f-b64a-7163fd150352",
  _pbLastUpdatedAt: "2023-05-15T18:31:26.688Z",
  _pbVersion: 2,
  _pbLink: "https://app.prooph-board.com/inspectio/board/ba59fb19-4d03-46fe-82a2-2725d61481ae?cells=riXgLkFo1Vdy5tF387JJ7y&amp;clicks=1",
};
