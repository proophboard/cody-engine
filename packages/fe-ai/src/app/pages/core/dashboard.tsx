import {TopLevelPage} from "@frontend-ai/app/pages/page-definitions";
import {staticLabel} from "@frontend-ai/util/breadcrumb/static-label";
import {ViewDashboard} from "mdi-material-ui";

export const Dashboard: TopLevelPage = {
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
