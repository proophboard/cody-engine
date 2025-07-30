import {Instruction, InstructionProvider} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {EyeOff, TrashCanOutline} from "mdi-material-ui";
import {CodyResponseType} from "@proophboard/cody-types";
import {Schema} from "@cody-play/infrastructure/vibe-cody/utils/schema/schema";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import {JSONSchema7} from "json-schema";
import {
  playDefinitionIdFromFQCN,
  playFQCNFromDefinitionId, playNodeLabel,
  playServiceFromFQCN
} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import {getEditedContextFromConfig} from "@cody-play/state/config-store";
import {withId} from "@cody-play/infrastructure/vibe-cody/utils/json-schema/with-id";
import {names} from "@event-engine/messaging/helpers";
import {namespaceNames, valueObjectNamespaceFromFQCN} from "@cody-engine/cody/hooks/utils/value-object/namespace";
import {withNavigateToProcessing} from "@cody-play/infrastructure/vibe-cody/utils/navigate/with-navigate-to-processing";
import {PlayInformationRuntimeInfo} from "@cody-play/state/types";
import {isQueryableStateListDescription, ListDescription} from "@event-engine/descriptions/descriptions";
import {get, set} from "lodash";
import {StringOrTableColumnUiSchema} from "@cody-play/infrastructure/cody/vo/play-vo-metadata";

const makeRemoveColumn = (columnName: string): Instruction => {
  return {
    text: `Remove column`,
    icon: <TrashCanOutline />,
    noInputNeeded: true,
    isActive: context => true,
    match: input => input.startsWith('Remove column'),
    execute: withNavigateToProcessing(async (input, ctx, dispatch, config, navigateTo) => {
      const [tableVoFQCN, field] = ctx.focusedElement!.id.split(':');

      const tableVO = config.types[tableVoFQCN] as PlayInformationRuntimeInfo;

      if(!tableVO) {
        return {
          cody: `I can't hide the column. I did not find the information type "${tableVoFQCN}" in the Cody Play config.`,
          details: `This seems to be a bug in Cody Play. Please contact the prooph board team!`,
          type: CodyResponseType.Error
        }
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
        itemFQCN = (tableVO.desc as ListDescription).itemType;
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
          cody: `I can't remove columns from the table, because the items schema of ${tableVO.desc.name} is not of type object and therefor no items properties can be defined.`,
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

export const makeHideColumn = (columnName: string): Instruction => {
  return {
    text: `Hide column`,
    icon: <EyeOff />,
    noInputNeeded: true,
    isActive: context => true,
    match: input => input.startsWith('Remove column'),
    execute: withNavigateToProcessing(async (input, ctx, dispatch, config, navigateTo) => {
      const [tableVoFQCN, field] = ctx.focusedElement!.id.split(':');

      const tableVO = config.types[tableVoFQCN];

      if(!tableVO) {
        return {
          cody: `I can't hide the column. I did not find the information type "${tableVoFQCN}" in the Cody Play config.`,
          details: `This seems to be a bug in Cody Play. Please contact the prooph board team!`,
          type: CodyResponseType.Error
        }
      }

      let uiSchema = cloneDeepJSON(tableVO.uiSchema || {});

      let existingColumns: StringOrTableColumnUiSchema[] = get(uiSchema, 'ui:table.columns', []);
      const existingColumnNames = existingColumns.map(c => typeof c === "string" ? c : c.field);

      const editedCtx = getEditedContextFromConfig(config);

      set(uiSchema, 'ui:table.columns', existingColumns.filter(c => {
        if(typeof c === "string" && c !== columnName) {
          return true;
        }

        if(typeof c === "object" && !(c.field === columnName)) {
          return true;
        }

        return false;
      }))

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
        cody: `Alright, the column is no longer shown in the table.`
      }
    })
  }
}


export const RemoveColumnQuestion: Instruction = {
  text: `Remove column`,
  icon: <TrashCanOutline/>,
  noInputNeeded: true,
  notUndoable: true,
  isActive: (context, config) => !!context.focusedElement && context.focusedElement.type === "tableColumn",
  match: input => input.startsWith('Remove column'),
  execute: async (input, ctx, dispatch, config, navigateTo) => {
    const pageConfig = ctx.page.handle.page;

    const [tableVoFQCN, field] = ctx.focusedElement!.id.split(':');

    return {
      cody: `Removing the column also means that the property "${field}" is removed from the information "${playNodeLabel(tableVoFQCN)}"!`,
      details: `Do you really want to remove or only hide the column?`,
      type: CodyResponseType.Question,
      answers: [
        makeHideColumn(field),
        makeRemoveColumn(field)
      ]
    }
  }
}

const getItemIdentifier = (tableVO: PlayInformationRuntimeInfo): string => {
  if(!isQueryableStateListDescription(tableVO.desc)) {
    return '__unknown__';
  }

  return tableVO.desc.itemIdentifier;
}
