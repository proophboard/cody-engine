import {QueryableStateDescription} from "@event-engine/descriptions/descriptions";

export const CarDesc: QueryableStateDescription = {
  name: "FleetManagement.Car.Car",
  isList: false,
  hasIdentifier: true,
  isQueryable: true,
  identifier: "vehicleId",

  query: "FleetManagement.GetCar",
  collection: "car_collection",
  _pbBoardId: "ba59fb19-4d03-46fe-82a2-2725d61481ae",
  _pbCardId: "p1fQ7GLYCCV4xEku1WFvMX",
  _pbCreatedBy: "a35267cd-dfd0-410f-b64a-7163fd150352",
  _pbCreatedAt: "2023-04-12T08:05:00+00",
  _pbLastUpdatedBy: "a35267cd-dfd0-410f-b64a-7163fd150352",
  _pbLastUpdatedAt: "2023-05-22T14:01:31.175Z",
  _pbVersion: 7,
  _pbLink: "https://app.prooph-board.com/inspectio/board/ba59fb19-4d03-46fe-82a2-2725d61481ae?cells=p1fQ7GLYCCV4xEku1WFvMX&amp;clicks=1",
};
