import {Instruction, InstructionProvider} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {AddAPageWithName} from "@cody-play/infrastructure/vibe-cody/page-instructions/add-a-page-with-name";
import {
  AddATableWithDefaults
} from "@cody-play/infrastructure/vibe-cody/information-instructions/add-a-table-with-defaults";
import {AddColumnsToTable} from "@cody-play/infrastructure/vibe-cody/information-instructions/add-columns-to-table";
import {AddTableItem} from "@cody-play/infrastructure/vibe-cody/command-instructions/add-table-item";
import {ChangeButtonLabel} from "@cody-play/infrastructure/vibe-cody/button-instructions/change-button-label";
import {
  ChangeButtonVariantProvider
} from "@cody-play/infrastructure/vibe-cody/button-instructions/change-button-variant";
import {FocusOnButtonProvider} from "@cody-play/infrastructure/vibe-cody/button-instructions/focus-on-button";
import {ChangeButtonColorProvider} from "@cody-play/infrastructure/vibe-cody/button-instructions/change-button-color";

type InstructionOrProvider = Instruction | InstructionProvider;

export const instructions: InstructionOrProvider[] = [
  AddAPageWithName,
  AddATableWithDefaults,
  AddColumnsToTable,
  AddTableItem,
  /* Button Instructions */
  FocusOnButtonProvider,
  ChangeButtonLabel,
  ChangeButtonVariantProvider,
  ChangeButtonColorProvider,
]
