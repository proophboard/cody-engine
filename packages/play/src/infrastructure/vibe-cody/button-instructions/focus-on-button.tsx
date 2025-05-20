import {Instruction, InstructionProvider} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {
  Action,
  CommandAction,
  getActionButtonName,
  getActionId,
} from "@frontend/app/components/core/form/types/action";
import {PlayPageDefinition, PlayViewComponentConfig} from "@cody-play/state/types";
import {FocusedButton} from "@cody-play/state/focused-element";
import {ViewComponent} from "@cody-engine/cody/hooks/utils/ui/types";
import {get} from "lodash";
import {getUiOptions} from "@rjsf/utils";
import { Target } from "mdi-material-ui";

export const FocusOnButtonProvider: InstructionProvider = {
  isActive: context => !context.focusedElement && context.page.pathname !== '/welcome',
  provide: (context, config) => {
    const page = context.page.handle.page;
    const focusedButtons: Instruction[] = getAllFocusableButtonsOnPage(page, config).map(a => ({
      isActive: () => true,
      text: `Focus on the button ${getActionButtonName(a.action)}`,
      icon: <Target />,
      match: input => input.startsWith(`Focus on button ${getActionButtonName(a.action)}`),
      noInputNeeded: true,
      execute: async () => {
        context.setFocusedElement(a)

        return {
          cody: `Alright, what do you want to change?`
        }
      }
    }));

    page.components.forEach(vc => {
      focusedButtons.push(
        ...getAllFocusableButtonsOnView(vc, config)
          .map(btn => ({
            isActive: () => true,
            text: `Focus on the button ${getActionButtonName(btn.action)}`,
            icon: <Target />,
            match: input => input.startsWith(`Focus on button ${getActionButtonName(btn.action)}`),
            noInputNeeded: true,
            execute: async () => {
              context.setFocusedElement(btn)

              return {
                cody: `Alright, what do you want to change?`
              }
            }
          }) as Instruction)
      )
    })

    return focusedButtons;
  }
}

const getAllFocusableButtonsOnPage = (page: PlayPageDefinition, config: CodyPlayConfig): FocusedButton[] => {
  return page.commands.map(c => {
    const action = typeof c === "string"
      ? {
        type: "command",
        command: c
      } as CommandAction
      : c;

    return {
      name: getActionButtonName(action),
      type: "button",
      id: getActionId(action),
      action: action,
      containerInfo: {
        name: page.name,
        type: "page"
      }
    }
  })
}

const getAllFocusableButtonsOnView = (view: ViewComponent, config: CodyPlayConfig): FocusedButton[] => {
  const viewName = typeof view === "string" ? view : view.view;

  const information = config.types[get(config.views[viewName], 'information', '')];

  if(!information) {
    // @todo: update button config on page.view.uiSchema override
    return [];
  }

  const uiOptions = getUiOptions(information.uiSchema || {});

  if(!uiOptions['actions'] || !Array.isArray(uiOptions['actions'])) {
    return [];
  }

  return uiOptions['actions'].map(action => ({
    name: getActionButtonName(action),
    type: "button",
    id: getActionId(action),
    action: action,
    containerInfo: {
      name: information.desc.name,
      type: "view"
    }
  }) as FocusedButton);
}
