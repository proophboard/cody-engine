import {Instruction} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {AddAPageWithName} from "@cody-play/infrastructure/vibe-cody/page-instructions/add-a-page-with-name";
import {
  AddATableWithDefaults
} from "@cody-play/infrastructure/vibe-cody/information-instructions/add-a-table-with-defaults";
import {AddColumnsToTable} from "@cody-play/infrastructure/vibe-cody/information-instructions/add-columns-to-table";
import {AddTableItem} from "@cody-play/infrastructure/vibe-cody/command-instructions/add-table-item";

export const instructions: Instruction[] = [
  AddAPageWithName,
  AddATableWithDefaults,
  AddColumnsToTable,
  AddTableItem,
]
