import {Instruction} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import { UndoVariant } from "mdi-material-ui";
import {CodyResponseType} from "@proophboard/cody-types";

const TEXT = 'Undo last action';

export const UndoLastAction: Instruction = {
  text: TEXT,
  icon: <UndoVariant />,
  noInputNeeded: true,
  notUndoable: true,
  isActive: context => context.hasHistory && !context.selectedInstruction,
  match: input => input.startsWith(TEXT),
  execute: async (input, ctx) => {
    await ctx.undo();

    return {
      cody: "",
      type: CodyResponseType.Empty
    }
  },
}
