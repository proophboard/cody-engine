import {Instruction, InstructionProvider} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {Target} from "mdi-material-ui";
import {UiSchema} from "@rjsf/utils";
import {PlayViewComponentConfig} from "@cody-play/state/types";
import {merge} from "lodash/fp";
import {informationTitle} from "@frontend/util/information/titelize";
import {
  isQueryableStateDescription,
  isQueryableStateListDescription
} from "@event-engine/descriptions/descriptions";
import {isFormView} from "@cody-play/infrastructure/vibe-cody/utils/view/is-form-view";


export const FocusOnViewProvider: InstructionProvider = {
  isActive: context => !context.focusedElement,
  provide: (context, config) => {
    const instructions: Instruction[] = [];

    context.page.handle.page.components.forEach(comp => {
      let uiSchemaOverride: UiSchema | undefined = undefined;
      let viewName = '';

      if (typeof comp === "string") {
        viewName = comp;
      } else {
        viewName = comp.view;
        uiSchemaOverride = comp.uiSchema || {};
      }

      const view = config.views[viewName];

      if(view && typeof view === "object") {
        const information = config.types[(view as PlayViewComponentConfig).information];

        if(information) {
          const uiSchema = merge(information.uiSchema || {}, uiSchemaOverride || {});

          const title = informationTitle(information, uiSchema);
          const TEXT = `Focus on view ${title}`;

          instructions.push({
            text: TEXT,
            icon: <Target />,
            noInputNeeded: true,
            notUndoable: true,
            isActive: context => !context.focusedElement,
            match: input => input.startsWith(TEXT),
            execute: async (input, ctx) => {
              ctx.setFocusedElement({
                id: information.desc.name,
                name: title,
                type: isQueryableStateDescription(information.desc)
                  ? isFormView(comp) ? "formView" : "stateView"
                  : isQueryableStateListDescription(information.desc) ? "table" : "viewTitle"
              })

              return {
                cody: `View title is focused`
              }
            }
          })
        }
      }
    })

    return instructions;
  }
}
