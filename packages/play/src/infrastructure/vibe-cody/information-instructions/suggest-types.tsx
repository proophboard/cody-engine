import {Instruction, InstructionProvider} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {getCurrentLine} from "@cody-play/infrastructure/vibe-cody/utils/text/get-current-line";
import {AddColumnsToTable} from "@cody-play/infrastructure/vibe-cody/information-instructions/add-columns-to-table";
import {isMultilineText} from "@cody-play/infrastructure/vibe-cody/utils/text/is-multiline-text";
import * as React from "react";
import {
  CalendarClockOutline,
  CalendarTodayOutline, CheckCircleOutline,
  ClockOutline, DatabaseOutline,
  FormatListChecks,
  FormatText,
  Identifier,
  LinkVariant,
  Numeric
} from "mdi-material-ui";
import {playNodeLabel} from "@cody-play/infrastructure/cody/schema/play-definition-id";

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
] as const;

const getIconForType = (type: string): React.ReactNode => {
  switch (type) {
    case 'string':
      return  <FormatText />;
    case 'uuid':
      return <Identifier />;
    case 'date':
      return <CalendarTodayOutline />;
    case 'time':
      return <ClockOutline />;
    case 'datetime':
      return <CalendarClockOutline />;
    case 'integer':
    case 'number':
      return <Numeric />;
    case 'boolean':
      return <CheckCircleOutline />;
    case 'enum:':
      return <FormatListChecks />;
    case 'link':
      return <LinkVariant />;
    default:
      return <DatabaseOutline />;
  }
}

const makeSuggestType = (propType: string, text: string): Instruction => {
  return {
    text,
    label: propType,
    icon: getIconForType(propType),
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

      // Only suggest types that start with rest, but not fully match rest
      // this is important, so that arrow up/down are working correcty and are not blocked by a single open suggestion
      const types = BASIC_TYPES.filter(t => t.startsWith(rest) && t !== rest).map(t => {
        lines[lineOfCursor] = `${prop}: ${t}`;
        return makeSuggestType(`${t}`, lines.join("\n"))
      })

       Object.values(config.types).filter(t => t.desc.hasIdentifier && t.desc.isQueryable && !t.desc.isList && playNodeLabel(t.desc.name).startsWith(rest) && playNodeLabel(t.desc.name) !== rest)
        .forEach(t => {
          const label = playNodeLabel(t.desc.name);

          lines[lineOfCursor] = `${prop}: ${label}[]`;
          types.unshift(makeSuggestType(`${label}[]`, lines.join("\n")));

          lines[lineOfCursor] = `${prop}: ${label}`;
          types.unshift(makeSuggestType(`${label}`, lines.join("\n")));

        })

      return types;
    } else {
      return [];
    }
  }
}
