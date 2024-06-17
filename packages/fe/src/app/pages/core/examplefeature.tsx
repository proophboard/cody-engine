import {TopLevelPage} from "@frontend/app/pages/page-definitions";
import {staticLabel} from "@frontend/util/breadcrumb/static-label";
import {Article} from '@mui/icons-material';

export const Examplefeature: TopLevelPage = {
  commands: [],
  components: ["Core.Examplefeature"],
  sidebar: {
    label: "Examplefeature",
    Icon: Article ,
    position: 0
  },

  route: "/Examplefeature",
  topLevel: true,
  breadcrumb: staticLabel('examplefeature')
}
