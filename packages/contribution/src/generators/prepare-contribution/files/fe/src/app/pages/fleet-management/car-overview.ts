import {TopLevelPageWithProophBoardDescription} from "@frontend/app/pages/page-definitions";
import {staticLabel} from "@frontend/util/breadcrumb/static-label";
import {CarMultiple} from "mdi-material-ui";

export const CarOverview: TopLevelPageWithProophBoardDescription = {
  topLevel: true,
  breadcrumb: staticLabel('Car Overview'),
  route: '/cars',
  sidebar: {label: 'Cars', Icon: CarMultiple},
  components: ["FleetManagement.CarList"],
  commands: ["FleetManagement.AddCarToFleet"],
  _pbBoardId: "ba59fb19-4d03-46fe-82a2-2725d61481ae",
  _pbCardId: "aevAyzYQkuebtV8BbiiAfS",
  _pbCreatedBy: "a35267cd-dfd0-410f-b64a-7163fd150352",
  _pbCreatedAt: "2023-04-12T08:05:00+00",
  _pbLastUpdatedBy: "a35267cd-dfd0-410f-b64a-7163fd150352",
  _pbLastUpdatedAt: "2023-04-12T08:05:00+00",
  _pbVersion: 1,
  _pbLink: "https://app.prooph-board.com/inspectio/board/ba59fb19-4d03-46fe-82a2-2725d61481ae?cells=aevAyzYQkuebtV8BbiiAfS&clicks=1"
}
