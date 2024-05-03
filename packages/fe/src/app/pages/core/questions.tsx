import {TopLevelPage} from "@frontend/app/pages/page-definitions";
import {staticLabel} from "@frontend/util/breadcrumb/static-label";
import {Article} from '@mui/icons-material';

export const Questions: TopLevelPage = {
  commands: [],
  components: ["Core.Questions"],
  sidebar: {
    label: "Questionnaire AI",
    Icon: Article ,
    position: 0
  },

  route: "/questions",
  topLevel: true,
  breadcrumb: staticLabel('Questions')
}
