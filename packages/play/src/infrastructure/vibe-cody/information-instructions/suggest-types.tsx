import {Instruction, InstructionProvider} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {getCurrentLine} from "@cody-play/infrastructure/vibe-cody/utils/text/get-current-line";
import {AddColumnsToTable} from "@cody-play/infrastructure/vibe-cody/information-instructions/add-columns-to-table";
import {isMultilineText} from "@cody-play/infrastructure/vibe-cody/utils/text/is-multiline-text";
import {moveCursor} from "@cody-play/infrastructure/vibe-cody/utils/text/cursor-position";

const BASIC_TYPES = [
  'string',
  'uuid',
  'date',
  'time',
  'datetime',
  'integer',
  'number',
  'boolean',
  'enum:',
  'link'
]

const makeSuggestType = (propType: string, text: string): Instruction => {
  return {
    text,
    label: propType,
    isActive: () => true,
    allowSubSuggestions: true,
    notUndoable: true,
    noInputNeeded: false,
    match: (input, cursorPosition) => getCurrentLine(input, cursorPosition).startsWith(propType),
    execute: async (input, ctx, dispatch, config, navigateTo) => {
      return await AddColumnsToTable.execute(input, ctx, dispatch, config, navigateTo);
    }
  }
}

export const ProvideTypeSuggestions: InstructionProvider = {
  isActive: context => isMultilineText(context.searchStr),
  provide: (context, config, env) => {
    let lineOfCursor = 0;
    const cursorPos = context.cursorPosition;
    const text = context.searchStr;

    if(cursorPos.start) {
      const linesUntilCursor = text.substring(0, cursorPos.start).split("\n");
      lineOfCursor = linesUntilCursor.length - 1;
    }

    const lines = text.split("\n");

    const currentLine = lines[lineOfCursor];

    const propParts = currentLine.split(":");

    if(propParts.length > 1) {
      const prop = propParts.shift() || '';
      let rest = propParts.join(":");

      if(rest === '') {
        return [];
      }

      rest = rest.trim();

      return BASIC_TYPES.filter(t => t.startsWith(rest)).map(t => {
        lines[lineOfCursor] = `${prop}: ${t}`;
        return makeSuggestType(`${t}`, lines.join("\n"))
      })
    } else {
      return [];
    }
  }
}
