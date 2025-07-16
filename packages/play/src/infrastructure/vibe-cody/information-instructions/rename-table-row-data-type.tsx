import {
  CodyInstructionResponse,
  Instruction,
  InstructionExecutionCallback,
  InstructionProvider
} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {CodyResponseType} from "@proophboard/cody-types";
import {Schema} from "@cody-play/infrastructure/vibe-cody/utils/schema/schema";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import {JSONSchema7} from "json-schema";
import {
  playDefinitionIdFromFQCN,
  playFQCNFromDefinitionId,
  playNodeLabel,
} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import {playRenameFQCN} from "@cody-play/infrastructure/vibe-cody/utils/play-rename-f-q-c-n";
import {renameType} from "@cody-play/infrastructure/vibe-cody/utils/types/rename-type";
import {CodyPlayConfig, getEditedContextFromConfig} from "@cody-play/state/config-store";
import {isListDescription} from "@event-engine/descriptions/descriptions";
import {WrenchCog} from "mdi-material-ui";
import {withNavigateToProcessing} from "@cody-play/infrastructure/vibe-cody/utils/navigate/with-navigate-to-processing";
import {VibeCodyContext} from "@cody-play/infrastructure/vibe-cody/VibeCodyContext";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {isTableFocused} from "@cody-play/infrastructure/vibe-cody/utils/types/is-table-focused";
import {
  getFocusedQueryableStateListVo
} from "@cody-play/infrastructure/vibe-cody/utils/types/get-focused-queryable-state-list-vo";

export const renameTableRowDataType = (newTypeName: string, ctx: VibeCodyContext, config: CodyPlayConfig): CodyPlayConfig | CodyInstructionResponse => {
  const pageConfig = ctx.page.handle.page;

  const tableVO = getFocusedQueryableStateListVo(ctx.focusedElement, pageConfig, config);

  if(playIsCodyError(tableVO)) {
    return tableVO;
  }

  const tableVoSchema = new Schema(cloneDeepJSON(tableVO.schema) as JSONSchema7, true);
  let emptySchema = new Schema({});
  let itemFQCN = '';

  if(tableVoSchema.getListItemsSchema(emptySchema).isRef()) {
    itemFQCN = playFQCNFromDefinitionId(tableVoSchema.getListItemsSchema(emptySchema).getRef());
  } else {
    itemFQCN = tableVO.desc.name + 'Item'
  }

  const newItemFQCN = playRenameFQCN(itemFQCN, newTypeName);
  const newConfig = renameType(itemFQCN, newItemFQCN, config);

  if(!tableVoSchema.getListItemsSchema(emptySchema).isRef()) {
    const tableVoJSONSchema = cloneDeepJSON(tableVO.schema) as JSONSchema7;
    tableVoJSONSchema.items = {
      $ref: playDefinitionIdFromFQCN(newItemFQCN)
    }

    newConfig.types[tableVO.desc.name].schema = tableVoJSONSchema;
    newConfig.definitions[playDefinitionIdFromFQCN(tableVO.desc.name)] = tableVoJSONSchema;
  }

  return newConfig;
}

const makeRenameTableRowDataType = (currentName: string): Instruction => {

  const TEXT = `Rename row data type from "${currentName}" to `;

  const renameRowType: InstructionExecutionCallback = async (input, ctx, dispatch, config, navigateTo) => {
    const newTypeName = input.replace(TEXT, '').trim();

    if(newTypeName === '') {
      return {
        cody: `Upps, you forgot to tell me a new name for the row data type!`,
        details: `Please, try again.`,
        type: CodyResponseType.Question,
        instructionReply: withNavigateToProcessing(renameRowType),
      }
    }

    const newConfig = renameTableRowDataType(newTypeName, ctx, config);

    if(playIsCodyError(newConfig)) {
      return newConfig;
    }


    dispatch({
      type: "INIT",
      payload: newConfig,
      ctx: getEditedContextFromConfig(newConfig),
    })

    return {
      cody: `No problem, row type is renamed.`
    }
  }

  return {
    text: TEXT,
    icon: <WrenchCog />,
    isActive: () => true,
    match: input => input.startsWith(TEXT),
    execute: withNavigateToProcessing(renameRowType),
  } as Instruction
}

export const RenameTableRowDataTypeProvider: InstructionProvider = {
  isActive: (context, config) => isTableFocused(context.focusedElement, context.page.handle.page, config),
  provide: (context, config) => {
    const pageConfig = context.page.handle.page;

    const tableVO = getFocusedQueryableStateListVo(context.focusedElement, pageConfig, config);

    if(playIsCodyError(tableVO)) {
      return [];
    }

    const {desc} = tableVO;

    if(!isListDescription(desc)) {
      return []
    }

    return [makeRenameTableRowDataType(playNodeLabel(desc.itemType))]
  }
}
