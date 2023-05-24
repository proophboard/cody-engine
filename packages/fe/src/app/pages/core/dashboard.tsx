import {TopLevelPage} from "@frontend/app/pages/page-definitions";
import {Welcome} from "@frontend/app/components/core/welcome";

export const Dashboard: TopLevelPage = {
  commands: [],
  components: [Welcome],
  sidebar: {
    label: "Dashboard"
  },
  route: "/",
  topLevel: true,
  breadcrumb: () => 'Dashboard'
}
