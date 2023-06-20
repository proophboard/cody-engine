import {TopLevelPage} from "@frontend/app/pages/page-definitions";
import {staticLabel} from "@frontend/util/breadcrumb/static-label";
import {CarMultiple} from "mdi-material-ui";

export const CarOverview: TopLevelPage = {
  topLevel: true,
  breadcrumb: staticLabel('Car Overview'),
  route: '/cars',
  sidebar: {label: 'Cars', Icon: CarMultiple},
  components: ["FleetManagement.Car.CarList"],
  commands: ["FleetManagement.AddCarToFleet"]
}
