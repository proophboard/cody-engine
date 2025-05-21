import {Instruction} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {getTableViewVO} from "@cody-play/infrastructure/vibe-cody/information-instructions/add-columns-to-table";
import {CodyResponse} from "@proophboard/cody-types";
import {TableRowRemove} from "mdi-material-ui";

const TEXT = `The user should be able to select rows and delete them.`;

export const BatchDeleteRows: Instruction = {
  text: TEXT,
  icon: <TableRowRemove />,
  isActive: (context, config) => !context.focusedElement && !!getTableViewVO(context.page.handle.page, config),
  match: input => input.startsWith(TEXT),
  execute: async (input, ctx, dispatch, config): Promise<CodyResponse> => {
    return {
      cody: `not implemented`
    }
  }
}
