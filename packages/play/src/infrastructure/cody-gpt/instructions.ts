import {Instruction} from "@cody-play/app/components/core/cody-gpt/CodyGPTDrawer";
import {AddAPageWithName} from "@cody-play/infrastructure/cody-gpt/page-instructions/add-a-page-with-name";
import {
  AddATableWithDefaults
} from "@cody-play/infrastructure/cody-gpt/information-instructions/add-a-table-with-defaults";
import {AddColumnsToTable} from "@cody-play/infrastructure/cody-gpt/information-instructions/add-columns-to-table";

export const instructions: Instruction[] = [
  AddAPageWithName,
  AddATableWithDefaults,
  AddColumnsToTable,
]
