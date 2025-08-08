import {Instruction, InstructionProvider} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {findPageByRoute} from "@cody-play/infrastructure/vibe-cody/utils/navigate/find-page-by-route";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {PlayPageDefinition} from "@cody-play/state/types";
import {FormatText} from "mdi-material-ui";
import {getLabelFromInstruction} from "@cody-play/infrastructure/vibe-cody/utils/text/get-label-from-instruction";
import {getEditedContextFromConfig} from "@cody-play/state/config-store";

export const TabInstructionsProvider: InstructionProvider = {
  isActive: context => !!context.focusedElement && context.focusedElement.type === "tab",
  provide: (context, config) => {
    const route = context.focusedElement!.id;
    console.log(route);
    const page = findPageByRoute(route, config);

    if(playIsCodyError(page)) {
      return [];
    }

    return [
      makeChangeTabLabel(page),
    ];
  }
}

const makeChangeTabLabel = (page: PlayPageDefinition): Instruction => {
  const TEXT = `Change label to `;

  return {
    text: TEXT,
    icon: <FormatText />,
    isActive: () => true,
    match: input => input.startsWith(TEXT),
    execute: async (input, ctx, dispatch, config) => {
      const label = getLabelFromInstruction(input, TEXT);

      dispatch({
        ctx: getEditedContextFromConfig(config),
        type: "ADD_PAGE",
        page: {
          ...page,
          tab: {
            ...page.tab!,
            label
          }
        },
        name: page.name
      });

      return {
        cody: `The label is changed.`
      }
    }
  }
}
