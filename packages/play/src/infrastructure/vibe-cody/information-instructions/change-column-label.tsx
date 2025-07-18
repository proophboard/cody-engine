import {Instruction} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {FormatText} from "mdi-material-ui";
import {getLabelFromInstruction} from "@cody-play/infrastructure/vibe-cody/utils/text/get-label-from-instruction";
import {CodyResponseType} from "@proophboard/cody-types";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import {get, set} from "lodash";
import {getEditedContextFromConfig} from "@cody-play/state/config-store";
import {playDefinitionIdFromFQCN} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import {JSONSchema7} from "json-schema";
import {TableColumnUiSchema} from "@cody-play/infrastructure/cody/vo/play-vo-metadata";

const TEXT = `Change label to `;

export const ChangeColumnLabel: Instruction = {
  text: TEXT,
  icon: <FormatText />,
  isActive: context => !!context.focusedElement && context.focusedElement.type === "tableColumn",
  match: input => input.startsWith(TEXT),
  execute: async (input, ctx, dispatch, config) => {
    const label = getLabelFromInstruction(input, TEXT);

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

    const columns = get(uiSchema, 'ui:table.columns', []);

    set(uiSchema, 'ui:table.columns', columns.map((c: TableColumnUiSchema | string) => {
      if(typeof c === "string" && c === field) {
        return {
          field,
          headerName: label
        }
      }

      if(typeof c === "object" && c.field === field) {
        return {
          ...c,
          headerName: label
        }
      }

      return c;
    }));

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
