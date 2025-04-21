import {Instruction} from "@cody-play/app/components/core/cody-gpt/CodyGPTDrawer";
import {CodyResponse, CodyResponseType} from "@proophboard/cody-types";
import {PlayInformationRuntimeInfo, PlayPageDefinition} from "@cody-play/state/types";
import {CodyPlayConfig, getEditedContextFromConfig} from "@cody-play/state/config-store";
import {isQueryableStateListDescription} from "@event-engine/descriptions/descriptions";
import {names} from "@event-engine/messaging/helpers";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import {isInlineItemsArraySchema, isObjectSchema} from "@app/shared/utils/schema-checks";
import {camelCaseToTitle} from "@cody-play/infrastructure/utils/string";
import {playDefinitionIdFromFQCN} from "@cody-play/infrastructure/cody/schema/play-definition-id";

const TEXT = 'Add the following columns to the table: ';

export const AddColumnsToTable: Instruction = {
  text: TEXT,
  isActive: (context, config) => !!getTableViewVO(context.page.handle.page, config),
  match: input => input.startsWith(TEXT),
  execute: async (input, ctx, dispatch, config): Promise<CodyResponse> => {
    const columns = input.replace(TEXT, '').split(",").map(c => names(c.trim()));

    const pageConfig = ctx.page.handle.page;

    const tableVO = getTableViewVO(pageConfig, config);

    if(!tableVO) {
      return {
        cody: `I can't find a table on the page ${pageConfig.name}`,
        type: CodyResponseType.Error
      }
    }

    const schema = cloneDeepJSON(tableVO.schema);
    let uiSchema = cloneDeepJSON(tableVO.uiSchema);

    // @TODO: handle ref items
    if(!isInlineItemsArraySchema(schema)) {
      return {
        cody: `I can't add columns to the table, because the schema of the view component ${tableVO.desc.name} is not an array schema (no items property defined).`,
        type: CodyResponseType.Error,
        details: `There seems to be something wrong with your Cody Play configuration of the page. Please have a look at the Cody Play tab in the Backend dialog.`
      }
    }

    const itemInfo = config.types[tableVO.desc.name + 'Item'];

    if(!itemInfo) {
      return {
        cody: `I can't add columns to the table. I found the information schema for the table ${tableVO.desc.name}, but not the schema for the column items. There should be a schema with name "${tableVO.desc.name}Item" registered in the types section of the Cody Play Config, but there is none.`
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

    const existingColumns = uiSchema['ui:table']['columns'];
    const existingColumnNames = existingColumns.map(c => typeof c === "string" ? c : c.field);


    const itemsSchema = schema.items;

    if(!isObjectSchema(itemsSchema)) {
      return {
        cody: `I can't add columns to the table, because the items schema of ${tableVO.desc.name} is not of type object and therefor no items properties can be defined.`,
        type: CodyResponseType.Error,
        details: `Either you change the schema by hand or you let me remove the information from the page and add another one.`
      }
    }

    columns.forEach(c => {
      if(!itemsSchema.properties[c.propertyName]) {
        itemsSchema.properties[c.propertyName] = {type: "string"};
        itemsSchema.required.push(c.propertyName);
      }

      if(!existingColumnNames.includes(c.propertyName)) {
        existingColumns.push({
          field: c.propertyName,
          headerName: camelCaseToTitle(c.propertyName)
        })
      }
    })

    const editedCtx = getEditedContextFromConfig(config);

    // Update Table VO
    dispatch({
      ctx: editedCtx,
      type: "ADD_TYPE",
      name: tableVO.desc.name,
      information: {
        desc: tableVO.desc,
        schema,
        uiSchema,
        factory: tableVO.factory,
      },
      definition: {
        definitionId: playDefinitionIdFromFQCN(tableVO.desc.name),
        schema
      }
    });

    // Update Table Item VO
    dispatch({
      ctx: editedCtx,
      type: "ADD_TYPE",
      name: itemInfo.desc.name,
      information: {
        desc: itemInfo.desc,
        schema: itemsSchema,
        uiSchema: itemInfo.uiSchema,
        factory: itemInfo.factory,
      },
      definition: {
        definitionId: playDefinitionIdFromFQCN(itemInfo.desc.name),
        schema: itemsSchema
      }
    });

    return {
      cody: `Alright, I've added the columns.`
    }
  }
}

const getTableViewVO = (page: PlayPageDefinition, config: CodyPlayConfig): PlayInformationRuntimeInfo | null => {
  if(!page.components.length) {
    return null;
  }

  for (const component of page.components) {
    const viewName = typeof component === "string" ? component : component.view;

    const view = config.views[viewName];

    if(typeof view === "object" && view.information) {
      if(!config.types[view.information]) {
        return null;
      }

      const voRuntimeInfo = config.types[view.information];

      if(isQueryableStateListDescription(voRuntimeInfo.desc)) {
        return voRuntimeInfo;
      }
    }
  }

  return null;
}
