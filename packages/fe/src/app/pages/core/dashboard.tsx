import {TopLevelPage} from "@frontend/app/pages/page-definitions";
import {staticLabel} from "@frontend/util/breadcrumb/static-label";
import {ViewDashboard} from "mdi-material-ui";

export const Dashboard: TopLevelPage = {
  name: "App.Dashboard",
  commands: [],
  components: ["Core.Welcome"],
  sidebar: {
    label: "Dashboard",
    Icon: ViewDashboard,
    position: -1
  },
  route: "/dashboard",
  topLevel: true,
  breadcrumb: staticLabel('Dashboard')
}
