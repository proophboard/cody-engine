import {
  Instruction,
  InstructionExecutionCallback,
  InstructionProvider
} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {
  isTableWithFixedFilterPossibilitiesFocused
} from "@cody-play/infrastructure/vibe-cody/utils/types/is-table-with-fixed-filter-possibilties-focused";
import {
  getFocusedQueryableStateListVo
} from "@cody-play/infrastructure/vibe-cody/utils/types/get-focused-queryable-state-list-vo";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {
  isQueryableNotStoredStateListDescription,
  ListDescription,
  QueryableStateListDescription, StateDescription
} from "@event-engine/descriptions/descriptions";
import {JSONSchema7} from "json-schema";
import {PlayInformationRuntimeInfo} from "@cody-play/state/types";
import {CodyResponseType} from "@proophboard/cody-types";
import {getEditedContextFromConfig} from "@cody-play/state/config-store";
import {ResolveConfig} from "@cody-play/infrastructure/cody/vo/play-vo-metadata";
import {withNavigateToProcessing} from "@cody-play/infrastructure/vibe-cody/utils/navigate/with-navigate-to-processing";
import {
  Equal,
  FilterSettingsOutline,
  GreaterThan,
  GreaterThanOrEqual,
  LessThan, LessThanOrEqual,
  NotEqualVariant
} from "mdi-material-ui";
import React, {ReactNode} from "react";
import {
  convertFilters,
  FilterType,
  parseFilters
} from "@cody-play/infrastructure/vibe-cody/utils/schema/property-filters";
import {Schema} from "@cody-play/infrastructure/vibe-cody/utils/schema/schema";
import {playServiceFromFQCN} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import {getCurrentLine} from "@cody-play/infrastructure/vibe-cody/utils/text/get-current-line";
import {CursorPosition} from "@cody-play/infrastructure/vibe-cody/utils/text/cursor-position";

const TEXT = `Apply a fixed filter`;

const getFilterTypeIcon = (filterType: FilterType): ReactNode => {
  switch (filterType) {
    case "isEqual":
      return <Equal />;
    case "isNotEqual":
      return <NotEqualVariant />;
    case "isGreaterThan":
      return <GreaterThan />;
    case "isGreaterThanOrEqual":
      return <GreaterThanOrEqual />;
    case "isLessThan":
      return <LessThan />;
    case "isLessThanOrEqual":
      return <LessThanOrEqual />;
  }
}

const execute: InstructionExecutionCallback = async (input, ctx, dispatch, config) => {
  const tableVO = getFocusedQueryableStateListVo(ctx.focusedElement, ctx.page.handle.page, config);

  if(playIsCodyError(tableVO)) {
    return tableVO;
  }

  const itemFQCN = (tableVO.desc as ListDescription).itemType;

  const itemInfo = config.types[itemFQCN];

  if(!itemInfo) {
    return {
      cody: `I can't apply filters. I found the information schema for the table ${tableVO.desc.name}, but not the schema for the column items. There should be a schema with name "${itemFQCN}" registered in the types section of the Cody Play Config, but there is none.`,
      type: CodyResponseType.Error
    }
  }


  const filters = parseFilters(input, itemInfo, config);

  const queryName = (tableVO.desc as QueryableStateListDescription).query;
  const query = config.queries[queryName];

  if(!query) {
    return {
      cody: `I can't find a query with name "${queryName}" in the Cody Play configuration.`,
      details: `This seems to be a bug. Please contact the prooph board team.`,
      type: CodyResponseType.Error
    }
  }

  const queryFilter = convertFilters(filters);

  if(playIsCodyError(queryFilter)) {
    return queryFilter;
  }

  const editedContext = getEditedContextFromConfig(config);

  const resolver: ResolveConfig = isQueryableNotStoredStateListDescription(tableVO.desc)
    ? {
      rules: [
        {
          rule: "always",
          then: {
            find: {
              information: (tableVO.desc as QueryableStateListDescription).itemType,
              filter: queryFilter
            }
          }
        }
      ]
    }
    : {
      where: {
        rule: "always",
        then: {
          filter: queryFilter
        }
      },
    };

  dispatch({
    ctx: editedContext,
    type: "ADD_QUERY",
    name: queryName,
    query,
    resolver,
  })

  return {
    cody: `The table is now filtered.`
  }
};

const makeFixedFilter = (label: string, text: string, filterType: FilterType, cursorPosition?: CursorPosition): Instruction => {
  return {
    text,
    label,
    icon: getFilterTypeIcon(filterType),
    allowSubSuggestions: true,
    keepAnswers: true,
    cursorPosition,
    isActive: () => true,
    match: (input, cursorPosition) => getCurrentLine(input, cursorPosition).startsWith(label),
    execute: withNavigateToProcessing(execute)
  }
}

export const ApplyAFixedFilterToTheTable: Instruction = {
  text: TEXT,
  icon: <FilterSettingsOutline />,
  noInputNeeded: true,
  notUndoable: true,
  isActive: (context, config) => isTableWithFixedFilterPossibilitiesFocused(context.focusedElement, context.page.handle.page, config),
  match: input => input.startsWith(TEXT),
  execute: async (input, ctx, dispatch, config) => {
    const tableVO = getFocusedQueryableStateListVo(ctx.focusedElement, ctx.page.handle.page, config);

    if(playIsCodyError(tableVO)) {
      return tableVO;
    }


    return {
      cody: `To permanently filter the table give me a list of "property: filter()" instructions in the following format:`,
      details: [
        `- property: isEqual(value)`,
        `- property: isNotEqual(value)`,
        `- property: isGreaterThan(value)`,
        `- property: isGreaterThanOrEqual(value)`,
        `- property: isLessThan(value)`,
        `- property: isLessThanOrEqual(value)\n`,
        `"value" can either be a fixed value or dynamic:\n`,
        `now() = current date(time)`,
        `user() = current user id`,
        `userAttr(attribute) = custom user attribute`,
        `expr($> ) = dynamic expression\n`,
        `Multiple property filters have to match all. Advanced filtering can be defined in the System View.`,
      ].join(`\n`),
      type: CodyResponseType.Question,
      answers: [makeFilterSuggestions(tableVO)]
    }
  }
}

const makeFilterSuggestions = (tableVO: PlayInformationRuntimeInfo): InstructionProvider => {
  return {
    isActive: (context, config) => isTableWithFixedFilterPossibilitiesFocused(context.focusedElement, context.page.handle.page, config),
    provide: (context, config) => {
      const itemFQCN = (tableVO.desc as ListDescription).itemType;

      const stateVO = config.types[itemFQCN];
      const stateVoJsonSchema = cloneDeepJSON(stateVO.schema) as JSONSchema7;

      if(!stateVO) {
        return [];
      }

      const stateDesc = stateVO.desc;

      let stateVoObjectSchema = new Schema(stateVoJsonSchema as JSONSchema7, true);

      if(stateVoObjectSchema.isRef()) {
        stateVoObjectSchema = stateVoObjectSchema.resolveRef(playServiceFromFQCN(stateDesc.name), config.types);
      }

      const properties = stateVoObjectSchema.getObjectProperties();

      const suggestions: Instruction[] = [];

      let lineOfCursor = 0;
      const cursorPos = context.cursorPosition;
      const text = context.searchStr;

      if(cursorPos.start) {
        const linesUntilCursor = text.substring(0, cursorPos.start).split("\n");
        lineOfCursor = linesUntilCursor.length - 1;
      }

      const lines = text.split("\n");
      const currentLine = lines[lineOfCursor];

      if(currentLine === '') {
        return [];
      }

      const cursorPosStartLine = lines.slice(0, lineOfCursor - 1).join(`\n`).length;

      properties.forEach(prop => {
        if (prop === (stateDesc as StateDescription).identifier) {
          return;
        }

        if (!currentLine.includes(":")) {
          lines[lineOfCursor] = `- ${prop}: `;
          suggestions.push(makeFixedFilter(`${prop}`, lines.join(`\n`), "isEqual"));
          return;
        }

        const [propBulletPoint,] = currentLine.split(":").map(p => p.trim());

        // Only suggest modifiers for the prop selected in current line
        if (!propBulletPoint.startsWith(`- ${prop}`)) {
          return;
        }

        const propSchema = stateVoObjectSchema.getObjectPropertySchema(prop, new Schema({}));
        const propJsonSchema = propSchema.toJsonSchema();

        if (propJsonSchema.enum) {
          propJsonSchema.enum.forEach(enumVal => {
            lines[lineOfCursor] = `${propBulletPoint}: isEqual(${enumVal})`;
            suggestions.push(makeFixedFilter(`isEqual(${enumVal})`, lines.join(`\n`), 'isEqual'));
            lines[lineOfCursor] = `${propBulletPoint}: isNotEqual(${enumVal})`;
            suggestions.push(makeFixedFilter(`isNotEqual(${enumVal})`, lines.join(`\n`), 'isNotEqual'));
          })
        } else if (propJsonSchema.type && propJsonSchema.type === "boolean") {
          lines[lineOfCursor] = `${propBulletPoint}: isEqual(true)`;
          suggestions.push(makeFixedFilter(`isEqual(true)`, lines.join(`\n`), 'isEqual'));
          lines[lineOfCursor] = `${propBulletPoint}: isNotEqual(true)`;
          suggestions.push(makeFixedFilter(`isNotEqual(true)`, lines.join(`\n`), 'isNotEqual'));
          lines[lineOfCursor] = `${propBulletPoint}: isEqual(false)`;
          suggestions.push(makeFixedFilter(`isEqual(false)`, lines.join(`\n`), 'isEqual'));
        } else {
          const filterTypes: FilterType[] = ["isEqual", "isNotEqual", "isGreaterThan", "isGreaterThanOrEqual", "isLessThan", "isLessThanOrEqual"];
          filterTypes.forEach(filterType => {
            if (currentLine.startsWith(`${propBulletPoint}: ${filterType}(`)) {
              // expr()
              lines[lineOfCursor] = `${propBulletPoint}: ${filterType}(expr($> ))`;
              suggestions.push(makeFixedFilter(`expr($> )`, lines.join(`\n`), filterType, {start: cursorPosStartLine + (lines[lineOfCursor].length - 2)}));

              // now()
              lines[lineOfCursor] = `${propBulletPoint}: ${filterType}(now())`;
              suggestions.push(makeFixedFilter(`now()`, lines.join(`\n`), filterType));

              // user()
              lines[lineOfCursor] = `${propBulletPoint}: ${filterType}(user())`;
              suggestions.push(makeFixedFilter(`user()`, lines.join(`\n`), filterType));

              // userAttr()
              lines[lineOfCursor] = `${propBulletPoint}: ${filterType}(userAttr())`;
              suggestions.push(makeFixedFilter(`userAttr()`, lines.join(`\n`), filterType, {start: cursorPosStartLine + (lines[lineOfCursor].length - 2)}));
            } else {
              lines[lineOfCursor] = `${propBulletPoint}: ${filterType}()`;
              suggestions.push(makeFixedFilter(`${filterType}()`, lines.join(`\n`), filterType, {start: cursorPosStartLine + (lines[lineOfCursor].length - 1)}));
            }
          })
        }
      })

      return suggestions;
    }
  }
}
