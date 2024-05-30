import {TopLevelPage} from "@frontend/app/pages/page-definitions";
import {staticLabel} from "@frontend/util/breadcrumb/static-label";
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';


export const Adminpanel: TopLevelPage = {
  commands: [],
  components: ["Core.Adminpanel"],
  sidebar: {
    label: "Adminpanel",
    Icon: SupervisorAccountIcon , //evt ändern?
    position: 0
  },

  route: "/adminpanel",
  topLevel: true,
  breadcrumb: staticLabel('Adminpanel')
}