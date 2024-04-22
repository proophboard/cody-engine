import {TopLevelPage} from "@frontend/app/pages/page-definitions";
import {staticLabel} from "@frontend/util/breadcrumb/static-label";
import {ViewDashboard} from "mdi-material-ui";
import { QuestionMark, QuestionMarkOutlined, QuestionMarkRounded } from '@mui/icons-material';

export const Questions: TopLevelPage = {
  commands: [],
  components: ["Core.Questions"],
  sidebar: {
    label: "Questions AI",
    Icon: QuestionMark,
    position: 0
  },

  route: "/questions",
  topLevel: true,
  breadcrumb: staticLabel('Questions')
}
