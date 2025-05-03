import {TopLevelPage} from "@frontend/app/pages/page-definitions";
import {staticLabel} from "@frontend/util/breadcrumb/static-label";
import {ViewDashboard} from "mdi-material-ui";

export const Welcome: TopLevelPage = {
  name: "App.Welcome",
  commands: [],
  components: ["Core.Welcome"],
  sidebar: {
    label: "Welcome",
    Icon: ViewDashboard,
    invisible: true
  },
  route: "/welcome",
  topLevel: true,
  title: " "
}
