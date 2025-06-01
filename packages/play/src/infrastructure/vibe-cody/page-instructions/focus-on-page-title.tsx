import {InstructionProvider} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {getPageTitle, PageDefinition} from "@frontend/app/pages/page-definitions";
import {Target} from "mdi-material-ui";


export const FocusOnPageTitleProvider: InstructionProvider = {
  isActive: context => !context.focusedElement,
  provide: context => {
    const TEXT = `Focus on page title ${getPageTitle(context.page.handle.page as PageDefinition)}`

    return [
      {
        text: TEXT,
        icon: <Target />,
        noInputNeeded: true,
        isActive: context => !context.focusedElement,
        match: input => input.startsWith(TEXT),
        execute: async (input, ctx) => {
          ctx.setFocusedElement({
            id: context.page.handle.page.name,
            name: getPageTitle(context.page.handle.page as PageDefinition),
            type: "pageTitle"
          })

          return {
            cody: `Page title is focused`
          }
        }
      }
    ]
  }
}
