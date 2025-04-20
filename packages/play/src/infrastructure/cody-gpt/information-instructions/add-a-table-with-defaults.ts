import {Instruction} from "@cody-play/app/components/core/cody-gpt/CodyGPTDrawer";
import {CodyResponse} from "@proophboard/cody-types";

const TEXT = "I'd like to see a table of ";

export const AddATableWithDefaults: Instruction = {
  text: TEXT,
  match: input => input.startsWith(TEXT),
  execute: async (input, dispatch, config): Promise<CodyResponse> => {
    const tableName = input.replace(TEXT, '').trim();

    return {
      cody: `@TODO: Implement`
    }
  }
}
