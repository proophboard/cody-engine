import {InstructionProvider} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {makeHideColumn} from "@cody-play/infrastructure/vibe-cody/information-instructions/remove-column";

export const HideColumnProvider: InstructionProvider = {
  isActive: context => !context.selectedInstruction && !!context.focusedElement && context.focusedElement.type === "tableColumn",
  provide: context => {

    const [tableVoFQCN, field] = context.focusedElement!.id.split(':');

    return [
      makeHideColumn(field)
    ]
  }
}
