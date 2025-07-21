import {
  InstructionProvider
} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {isTableFocused} from "@cody-play/infrastructure/vibe-cody/utils/types/is-table-focused";
import {
  getFocusedQueryableStateListVo
} from "@cody-play/infrastructure/vibe-cody/utils/types/get-focused-queryable-state-list-vo";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {ListDescription} from "@event-engine/descriptions/descriptions";
import {CogPlayOutline, PlusBoxOutline} from "mdi-material-ui";
import {AddStateAction, TEXT} from "@cody-play/infrastructure/vibe-cody/command-instructions/add-state-action";

export const DefineAddTableItemActionProvider: InstructionProvider = {
  isActive: (context, config) => isTableFocused(context.focusedElement, context.page.handle.page, config),
  provide: (context, config) => {
    const pageConfig = context.page.handle.page;

    const tableVO = getFocusedQueryableStateListVo(context.focusedElement, pageConfig, config);

    if(playIsCodyError(tableVO)) {
      return [];
    }

    const itemInfo = config.types[(tableVO.desc as ListDescription).itemType];

    if(!itemInfo) {
      return [];
    }

    return [
      {
        text: TEXT,
        icon: <CogPlayOutline />,
        notUndoable: true,
        isActive: (context, config) => isTableFocused(context.focusedElement, context.page.handle.page, config),
        match: input => input.startsWith(TEXT),
        execute: async (input, ctx, dispatch, config, navigateTo) => {
          return await AddStateAction.execute(input, ctx, dispatch, config, navigateTo, itemInfo, true);
        }
      }
    ]
  }
}
