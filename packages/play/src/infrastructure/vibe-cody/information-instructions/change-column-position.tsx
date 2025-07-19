import {Instruction, InstructionProvider} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {
  ArrowCircleLeft,
  ArrowCircleLeftOutlined,
  ArrowCircleRight,
  ArrowCircleRightOutlined
} from "@mui/icons-material";
import {CodyResponseType} from "@proophboard/cody-types";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import {get, set} from "lodash";
import {StringOrTableColumnUiSchema} from "@cody-play/infrastructure/cody/vo/play-vo-metadata";
import {getEditedContextFromConfig} from "@cody-play/state/config-store";
import {playDefinitionIdFromFQCN} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import {JSONSchema7} from "json-schema";

export const ChangeColumnPositionProvider: InstructionProvider = {
  isActive: context => !!context.focusedElement && context.focusedElement.type === "tableColumn",
  provide: (context, config) => {
    const [tableVoFQCN, field] = context.focusedElement!.id.split(':');

    const tableVO = config.types[tableVoFQCN];

    if(!tableVO) {
      return [];
    }

    // @TODO: Also check page component config for column definition
    const uiSchema = cloneDeepJSON(tableVO.uiSchema || {});

    const columns: StringOrTableColumnUiSchema[] = get(uiSchema, 'ui:table.columns', []);

    let isFirst = false;
    let isLast = false;

    const lastIndex = columns.length - 1;

    columns.forEach((c, index) => {
      if(index === 0 && isColumnOfField(c, field)) {
        isFirst = true;
      }

      if(index === lastIndex && isColumnOfField(c, field)) {
        isLast = true;
      }
    })

    const instructions: Instruction[] = [];

    if(!isFirst) {
      instructions.push(makeChangeColumnPosition('left'));
    }

    if(!isLast) {
      instructions.push(makeChangeColumnPosition('right'));
    }

    return instructions;
  }
}

const makeChangeColumnPosition = (direction: 'left' | 'right'): Instruction => {
  return {
    text: `Move column ${direction}`,
    icon: direction === 'left' ? <ArrowCircleLeftOutlined /> : <ArrowCircleRightOutlined />,
    noInputNeeded: true,
    isActive: context => !!context.focusedElement && context.focusedElement.type === "tableColumn",
    match: input => input.startsWith(`Move column ${direction}`),
    execute: async (input, ctx, dispatch, config) => {
      const [tableVoFQCN, field] = ctx.focusedElement!.id.split(':');

      const tableVO = config.types[tableVoFQCN];

      if(!tableVO) {
        return {
          cody: `I can't change the column label. I did not find the information type "${tableVoFQCN}" in the Cody Play config.`,
          details: `This seems to be a bug in Cody Play. Please contact the prooph board team!`,
          type: CodyResponseType.Error
        }
      }

      // @TODO: Also check page component config for column definition
      const uiSchema = cloneDeepJSON(tableVO.uiSchema || {});

      const columns: StringOrTableColumnUiSchema[] = get(uiSchema, 'ui:table.columns', []);

      let column: StringOrTableColumnUiSchema | undefined = undefined;
      const beforeColumns: StringOrTableColumnUiSchema[] = [];
      const afterColumns: StringOrTableColumnUiSchema[] = [];

      columns.forEach(c => {
        if(isColumnOfField(c, field)) {
          column = c;
        } else if (column) {
          afterColumns.push(c);
        } else {
          beforeColumns.push(c);
        }
      })

      if(!column) {
        return {
          cody: `I can't find the column in the UI Schema of information "${tableVoFQCN}".`,
          details: `This seems to be a bug, please contact the prooph board team`,
          type: CodyResponseType.Error
        }
      }

      if(direction === "left") {
        const beforeColumn = beforeColumns.pop();

        beforeColumns.push(column);
        if(beforeColumn) {
          beforeColumns.push(beforeColumn);
        }
      } else {
        const afterColumn = afterColumns.shift();

        afterColumns.unshift(column);

        if(afterColumn) {
          afterColumns.unshift(afterColumn);
        }
      }


      set(uiSchema, 'ui:table.columns', [...beforeColumns, ...afterColumns]);

      const editedCtx = getEditedContextFromConfig(config);

      // Update Table VO
      dispatch({
        ctx: editedCtx,
        type: "ADD_TYPE",
        name: tableVO.desc.name,
        information: {
          desc: tableVO.desc,
          schema: tableVO.schema,
          uiSchema,
          factory: tableVO.factory,
        },
        definition: {
          definitionId: playDefinitionIdFromFQCN(tableVO.desc.name),
          schema: tableVO.schema as JSONSchema7,
        }
      });

      return {
        cody: `Table column label is changed.`
      }
    }
  }
}

const isColumnOfField = (column: StringOrTableColumnUiSchema, field: string): boolean => {
  if(typeof column === "string") {
    return column === field;
  }

  return column.field === field;
}
