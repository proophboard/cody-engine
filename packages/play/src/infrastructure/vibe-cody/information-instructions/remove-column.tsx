import {Instruction, InstructionProvider} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {TrashCanOutline} from "mdi-material-ui";
import {CodyResponseType} from "@proophboard/cody-types";
import {Schema} from "@cody-play/infrastructure/vibe-cody/utils/schema/schema";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import {JSONSchema7} from "json-schema";
import {
  playDefinitionIdFromFQCN,
  playFQCNFromDefinitionId,
  playServiceFromFQCN
} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import {getEditedContextFromConfig} from "@cody-play/state/config-store";
import {withId} from "@cody-play/infrastructure/vibe-cody/utils/json-schema/with-id";
import {names} from "@event-engine/messaging/helpers";
import {namespaceNames, valueObjectNamespaceFromFQCN} from "@cody-engine/cody/hooks/utils/value-object/namespace";
import {withNavigateToProcessing} from "@cody-play/infrastructure/vibe-cody/utils/navigate/with-navigate-to-processing";
import {camelCaseToTitle} from "@cody-play/infrastructure/utils/string";
import {PlayInformationRuntimeInfo} from "@cody-play/state/types";
import {isQueryableStateListDescription} from "@event-engine/descriptions/descriptions";
import {isTableFocused} from "@cody-play/infrastructure/vibe-cody/utils/types/is-table-focused";
import {
  getFocusedQueryableStateListVo
} from "@cody-play/infrastructure/vibe-cody/utils/types/get-focused-queryable-state-list-vo";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";

const makeRemoveColumn = (columnTitle: string, columnName: string): Instruction => {
  const TEXT = `Remove column ${columnTitle}`;

  return {
    text: TEXT,
    icon: <TrashCanOutline />,
    noInputNeeded: true,
    isActive: (context, config) => isTableFocused(context.focusedElement, context.page.handle.page, config),
    match: input => input.startsWith(TEXT),
    execute: withNavigateToProcessing(async (input, ctx, dispatch, config, navigateTo) => {
      const pageConfig = ctx.page.handle.page;

      const tableVO = getFocusedQueryableStateListVo(ctx.focusedElement, pageConfig, config);

      if(playIsCodyError(tableVO)) {
        return tableVO;
      }

      const tableVoSchema = new Schema(cloneDeepJSON(tableVO.schema) as JSONSchema7, true);
      let uiSchema = cloneDeepJSON(tableVO.uiSchema);
      let itemSchema = new Schema({}, true);
      let itemFQCN = '';

      if(tableVoSchema.getListItemsSchema(itemSchema).isRef()) {
        itemSchema = tableVoSchema.getListItemsSchema(itemSchema).resolveRef(playServiceFromFQCN(tableVO.desc.name), config.types)
        itemFQCN = playFQCNFromDefinitionId(tableVoSchema.getListItemsSchema(itemSchema).getRef());
      } else {
        itemSchema = tableVoSchema.getListItemsSchema(itemSchema);
        itemFQCN = tableVO.desc.name + 'Item'

      }

      const itemInfo = config.types[itemFQCN];

      if(!itemInfo) {
        return {
          cody: `I can't remove columns from the table. I found the information schema for the table ${tableVO.desc.name}, but not the schema for the column items. There should be a schema with name "${itemFQCN}" registered in the types section of the Cody Play Config, but there is none.`
        }
      }

      if(!uiSchema) {
        uiSchema = {};
      }

      if(!uiSchema['ui:table']) {
        uiSchema['ui:table'] = {}
      }

      if(!uiSchema['ui:table']['columns']) {
        uiSchema['ui:table']['columns'] = [];
      }

      const itemUiSchema = cloneDeepJSON(itemInfo.uiSchema || {});
      let existingColumns = uiSchema['ui:table']['columns'];
      const existingColumnNames = existingColumns.map(c => typeof c === "string" ? c : c.field);

      if(!itemSchema.isObject()) {
        return {
          cody: `I can't remove columns to the table, because the items schema of ${tableVO.desc.name} is not of type object and therefor no items properties can be defined.`,
          type: CodyResponseType.Error,
          details: `Either you change the schema by hand or you let me remove the entire table from the page and add another one.`
        }
      }

      const serviceNames = names(playServiceFromFQCN(tableVO.desc.name));
      const ns = namespaceNames(valueObjectNamespaceFromFQCN(tableVO.desc.name));
      const editedCtx = getEditedContextFromConfig(config);

      uiSchema['ui:table']['columns'] = uiSchema['ui:table']['columns'].filter(c => {
        if(typeof c === "string" && c !== columnName) {
          return true;
        }

        if(typeof c === "object" && !(c.field === columnName)) {
          return true;
        }

        return false;
      });

      if(itemUiSchema[columnName]) {
        delete itemUiSchema[columnName];
        if(itemUiSchema['ui:order']) {
          itemUiSchema['ui:order'] = (itemUiSchema['ui:order'] || []).filter(c => c !== columnName);
        }
      }

      const itemJsonSchema = itemSchema.toJsonSchema(`/${serviceNames.fileName}/${ns.fileName}`);

      if(itemJsonSchema.properties && itemJsonSchema.properties[columnName]) {
        delete itemJsonSchema.properties[columnName];
        itemJsonSchema.required = (itemJsonSchema.required || []).filter(c => c !== columnName);
      }

      // Update Table VO
      dispatch({
        ctx: editedCtx,
        type: "ADD_TYPE",
        name: tableVO.desc.name,
        information: {
          desc: tableVO.desc,
          schema: withId(tableVoSchema.toJsonSchema(`/${serviceNames.fileName}/${ns.fileName}`), tableVO.desc.name),
          uiSchema,
          factory: tableVO.factory,
        },
        definition: {
          definitionId: playDefinitionIdFromFQCN(tableVO.desc.name),
          schema: withId(tableVoSchema.toJsonSchema(`/${serviceNames.fileName}/${ns.fileName}`), tableVO.desc.name),
        }
      });

      // Update Table Item VO
      dispatch({
        ctx: editedCtx,
        type: "ADD_TYPE",
        name: itemInfo.desc.name,
        information: {
          desc: itemInfo.desc,
          schema: withId(itemJsonSchema, itemInfo.desc.name),
          uiSchema: itemUiSchema,
          factory: itemInfo.factory,
        },
        definition: {
          definitionId: playDefinitionIdFromFQCN(itemInfo.desc.name),
          schema: withId(itemJsonSchema, itemInfo.desc.name),
        }
      });

      return {
        cody: `Alright, I've removed the column.`
      }
    })
  }
}

const getItemIdentifier = (tableVO: PlayInformationRuntimeInfo): string => {
  if(!isQueryableStateListDescription(tableVO.desc)) {
    return '__unknown__';
  }

  return tableVO.desc.itemIdentifier;
}

export const RemoveColumnProvider: InstructionProvider = {
  isActive: (context, config) => isTableFocused(context.focusedElement, context.page.handle.page, config),
  provide: (context, config) => {
    const tableVO = getFocusedQueryableStateListVo(context.focusedElement, context.page.handle.page, config);

    if(playIsCodyError(tableVO)) {
      return [];
    }

    const tableVoSchema = new Schema(cloneDeepJSON(tableVO.schema) as JSONSchema7, true);
    let itemSchema = new Schema({}, true);

    if(tableVoSchema.getListItemsSchema(itemSchema).isRef()) {
      itemSchema = tableVoSchema.getListItemsSchema(itemSchema).resolveRef(playServiceFromFQCN(tableVO.desc.name), config.types)
    } else {
      itemSchema = tableVoSchema.getListItemsSchema(itemSchema);
    }

    const itemIdentifier = getItemIdentifier(tableVO);

    return itemSchema.getObjectProperties().filter(prop => prop !== itemIdentifier).map(prop => {
      const propSchema = itemSchema.getObjectPropertySchema(prop, undefined);

      return makeRemoveColumn(propSchema?.toJsonSchema().title || camelCaseToTitle(prop), prop);
    })
  }
}
