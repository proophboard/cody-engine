import {Instruction, InstructionProvider} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {PlayPageDefinition, PlayViewComponentConfig} from "@cody-play/state/types";
import {PlayConfigDispatch} from "@cody-play/infrastructure/cody/cody-message-server";
import {CodyPlayConfig, getEditedContextFromConfig} from "@cody-play/state/config-store";
import {Eye, EyeOff, FormatText} from "mdi-material-ui";
import {getPageTitle, PageDefinition} from "@frontend/app/pages/page-definitions";
import {ViewComponent} from "@cody-engine/cody/hooks/utils/ui/types";
import {showTitle} from "@frontend/util/schema/show-title";
import {merge} from "lodash/fp";
import {informationTitle} from "@frontend/util/information/titelize";

const getViewName = (v: ViewComponent): string => {
  return typeof v === "string" ? v : v.view;
}

const getInformationViewComponent = (infoFQCN: string, page: PlayPageDefinition, config: CodyPlayConfig): ViewComponent | undefined => {

  for (const viewName in config.views) {
    const v = config.views[viewName];
    if(typeof v === "object" && (v as PlayViewComponentConfig).information === infoFQCN) {
      return page.components.filter(comp => getViewName(comp) === viewName).shift();
    }
  }
}

const changeViewTitle = (title: string, viewFQCN: string, page: PlayPageDefinition, dispatch: PlayConfigDispatch, config: CodyPlayConfig) => {
  let component = page.components.filter(v => getViewName(v) === viewFQCN).shift();

  if(!component || typeof component === "string") {
    component = {
      view: viewFQCN,
      uiSchema: {
        'ui:title': title,
      }
    }
  } else {
    component = {
      ...component,
      uiSchema: {
        ...(component.uiSchema || {}),
        'ui:title': title
      }
    }
  }

  dispatch({
    ctx: getEditedContextFromConfig(config),
    type: "ADD_PAGE",
    page: {
      ...page,
      components: page.components.map(v => getViewName(v) === viewFQCN ? component! : v),
    },
    name: page.name
  })
}

export const ChangeViewTitleProvider: InstructionProvider = {
  isActive: context => context.focusedElement?.type === "viewTitle",
  provide: (context, config) => {

    const page = context.page.handle.page;
    const information = config.types[context.focusedElement!.id];
    const informationViewComponent = getInformationViewComponent(information.desc.name, page, config);

    if(!informationViewComponent) {
      return [];
    }

    const uiSchema = merge(information.uiSchema || {}, (typeof informationViewComponent === "object" && informationViewComponent.uiSchema) || {});

    const instructions: Instruction[] = [];

    instructions.push({
      text: `Change label to `,
      icon: <FormatText />,
      isActive: context => context.focusedElement?.type === "viewTitle",
      match: input => input.startsWith('Change label to '),
      execute: async (input, ctx, dispatch, config1) => {
        const label = input.replace(`Change label to `, '').trim();

        changeViewTitle(label, getViewName(informationViewComponent), page, dispatch, config1);

        return {
          cody: `The label is changed.`
        }
      }
    })

    if(showTitle(uiSchema)) {
      instructions.push({
        text: `Hide the title`,
        icon: <EyeOff />,
        noInputNeeded: true,
        isActive: context => context.focusedElement?.type === "pageTitle",
        match: input => input.startsWith(`Hide the title`),
        execute: async (input, ctx, dispatch, config1) => {
          changeViewTitle('', getViewName(informationViewComponent), page, dispatch, config1);

          return {
            cody: `Ok, view title is now hidden.`
          }
        }
      })
    } else {
      instructions.push({
        text: `Show the title again`,
        icon: <Eye />,
        noInputNeeded: true,
        isActive: context => context.focusedElement?.type === "viewTitle",
        match: input => input.startsWith(`Show the title`),
        execute: async (input, ctx, dispatch, config1) => {
          changeViewTitle(informationTitle(information, uiSchema), getViewName(informationViewComponent), page, dispatch, config1);

          return {
            cody: `Ok, view title is shown.`
          }
        }
      })
    }

    return instructions;

  }
}
