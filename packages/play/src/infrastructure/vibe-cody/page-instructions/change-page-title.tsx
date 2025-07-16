import {Instruction, InstructionProvider} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {PlayPageDefinition} from "@cody-play/state/types";
import {PlayConfigDispatch} from "@cody-play/infrastructure/cody/cody-message-server";
import {CodyPlayConfig, getEditedContextFromConfig} from "@cody-play/state/config-store";
import {Eye, EyeOff, FormatText} from "mdi-material-ui";
import {getPageTitle, PageDefinition} from "@frontend/app/pages/page-definitions";
import {getLabelFromInstruction} from "@cody-play/infrastructure/vibe-cody/utils/text/get-label-from-instruction";
import {isExpression} from "@cody-play/infrastructure/vibe-cody/utils/text/is-expression";
import {omit} from "lodash";
import {findTabsOfGroup} from "@cody-play/infrastructure/vibe-cody/utils/navigate/find-tabs-of-group";

const changePageTitle = (title: string, page: PlayPageDefinition, dispatch: PlayConfigDispatch, config: CodyPlayConfig) => {
  const prop = isExpression(title) ? 'title:expr' : 'title';

  dispatch({
    ctx: getEditedContextFromConfig(config),
    type: "ADD_PAGE",
    page: {
      ...omit(page, ['title', 'title:expr']),
      [prop]: title,
    },
    name: page.name
  })
}

export const ChangePageTitleProvider: InstructionProvider = {
  isActive: context => context.focusedElement?.type === "pageTitle",
  provide: (context, config) => {

    const page = config.pages[context.focusedElement!.id];

    const instructions: Instruction[] = [];

    instructions.push({
      text: `Change label to `,
      icon: <FormatText />,
      isActive: context => context.focusedElement?.type === "pageTitle",
      match: input => input.startsWith('Change label to '),
      execute: async (input, ctx, dispatch, config1) => {
        const label = getLabelFromInstruction(input, `Change label to `);

        changePageTitle(label, page, dispatch, config1);

        if(page.tab) {
          findTabsOfGroup(page, config.pages).forEach(tab => {
            changePageTitle(label, tab, dispatch, config1);
          })
        }

        return {
          cody: `The label is changed.`
        }
      }
    })

    if(typeof page.title === "undefined" || page.title !== '' || page["title:expr"]) {
      instructions.push({
        text: `Hide the title`,
        icon: <EyeOff />,
        noInputNeeded: true,
        isActive: context => context.focusedElement?.type === "pageTitle",
        match: input => input.startsWith(`Hide the title`),
        execute: async (input, ctx, dispatch, config1) => {
          changePageTitle('', page, dispatch, config1);

          return {
            cody: `Ok, page title is now hidden.`
          }
        }
      })
    } else {
      instructions.push({
        text: `Show the title again`,
        icon: <Eye />,
        noInputNeeded: true,
        isActive: context => context.focusedElement?.type === "pageTitle",
        match: input => input.startsWith(`Show the title`),
        execute: async (input, ctx, dispatch, config1) => {
          changePageTitle(getPageTitle(page as PageDefinition), page, dispatch, config1);

          return {
            cody: `Ok, page title is shown.`
          }
        }
      })
    }

    return instructions;

  }
}
