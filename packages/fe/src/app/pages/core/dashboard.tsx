import {TopLevelPage} from "@frontend/app/pages/page-definitions";
import {Welcome} from "@frontend/app/components/core/welcome";
import {staticLabel} from "@frontend/util/breadcrumb/static-label";
import {ViewDashboard} from "mdi-material-ui";

export const Dashboard: TopLevelPage = {
  commands: [],
  components: [Welcome],
  sidebar: {
    label: "Dashboard",
    Icon: ViewDashboard
  },
  route: "/dashboard",
  topLevel: true,
  breadcrumb: staticLabel('Dashboard')
}
