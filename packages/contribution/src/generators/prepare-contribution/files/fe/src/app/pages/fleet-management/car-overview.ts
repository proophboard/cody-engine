import {TopLevelPage} from "@frontend/app/pages/page-definitions";
import {CarList} from "@frontend/app/components/fleet-management/car-list";
import {staticLabel} from "@frontend/util/breadcrumb/static-label";
import {CarMultiple} from "mdi-material-ui";
import AddCarToFleet from "@frontend/app/components/fleet-management/AddCarToFleet";

export const CarOverview: TopLevelPage = {
  topLevel: true,
  breadcrumb: staticLabel('Car Overview'),
  route: '/cars',
  sidebar: {label: 'Cars', Icon: CarMultiple},
  components: [CarList],
  commands: [
    AddCarToFleet,
  ]
}
