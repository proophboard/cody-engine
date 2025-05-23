import {Instruction} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {CodyResponse, CodyResponseType} from "@proophboard/cody-types";
import {PlayInformationRuntimeInfo, PlayPageDefinition} from "@cody-play/state/types";
import {CodyPlayConfig, getEditedContextFromConfig} from "@cody-play/state/config-store";
import {
  isListDescription,
  isQueryableStateListDescription,
  isStateDescription
} from "@event-engine/descriptions/descriptions";
import {Names, names} from "@event-engine/messaging/helpers";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import {camelCaseToTitle} from "@cody-play/infrastructure/utils/string";
import {
  playDefinitionIdFromFQCN,
  playFQCNFromDefinitionId,
  playServiceFromFQCN
} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import {TableColumn} from "mdi-material-ui";
import {isMultilineText} from "@cody-play/infrastructure/vibe-cody/utils/is-multiline-text";
import {
  getSchemaFromNodeDescription
} from "@cody-play/infrastructure/vibe-cody/utils/schema/get-schema-from-node-description";
import {namespaceNames, valueObjectNamespaceFromFQCN} from "@cody-engine/cody/hooks/utils/value-object/namespace";
import {JSONSchema7} from "json-schema";
import {Schema} from "@cody-play/infrastructure/vibe-cody/utils/schema/schema";
import {withId} from "@cody-play/infrastructure/vibe-cody/utils/json-schema/with-id";
import {CodyResponseException} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {merge} from "lodash/fp";
import {registryIdToDataReference} from "@app/shared/utils/registry-id-to-data-reference";
import {startCase} from "lodash";

const TEXT = 'Add the following columns to the table: ';

export const AddColumnsToTable: Instruction = {
  text: TEXT,
  icon: <TableColumn />,
  isActive: (context, config) => !context.focusedElement && !!getTableViewVO(context.page.handle.page, config),
  match: input => input.startsWith(TEXT),
  execute: async (input, ctx, dispatch, config): Promise<CodyResponse> => {

    const pageConfig = ctx.page.handle.page;

    const tableVO = getTableViewVO(pageConfig, config);

    if(!tableVO) {
      return {
        cody: `I can't find a table on the page ${pageConfig.name}`,
        type: CodyResponseType.Error
      }
    }

    const tableVoSchema = new Schema(cloneDeepJSON(tableVO.schema) as JSONSchema7, true);
    let uiSchema = cloneDeepJSON(tableVO.uiSchema);
    let itemSchema = new Schema({});
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
        cody: `I can't add columns to the table. I found the information schema for the table ${tableVO.desc.name}, but not the schema for the column items. There should be a schema with name "${itemFQCN}" registered in the types section of the Cody Play Config, but there is none.`
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
    const existingColumns = uiSchema['ui:table']['columns'];
    const existingColumnNames = existingColumns.map(c => typeof c === "string" ? c : c.field);

    if(!itemSchema.isObject()) {
      return {
        cody: `I can't add columns to the table, because the items schema of ${tableVO.desc.name} is not of type object and therefor no items properties can be defined.`,
        type: CodyResponseType.Error,
        details: `Either you change the schema by hand or you let me remove the information from the page and add another one.`
      }
    }

    const serviceNames = names(playServiceFromFQCN(tableVO.desc.name));
    const ns = namespaceNames(valueObjectNamespaceFromFQCN(tableVO.desc.name));
    let columnNames: Names[] = [];

    if(isMultilineText(input)) {
      const schema = getSchemaFromNodeDescription(
        input.replace(TEXT, '')
          .split(`\n`)
          .filter(line => line.trim() !== '')
          .join(`\n`)
      );

      schema.getObjectProperties().forEach(prop => {
        if(!itemSchema.getObjectPropertySchema(prop)) {
          const propSchema = schema.getObjectPropertySchema(prop, new Schema({type: "string", title: camelCaseToTitle(prop)}));
          const propJsonSchema = propSchema.toJsonSchema(`/${serviceNames.fileName}/${ns.fileName}`);
          if(!propJsonSchema.title) {
            propJsonSchema.title = camelCaseToTitle(prop);
          }

          if(propSchema.isRef()) {
            const propRefInfo = propSchema.getRefRuntimeInfo(serviceNames.className, config.types);

            if(!propRefInfo) {
              throw new CodyResponseException({
                cody: `I can't resolve the reference "${propSchema.getRef()}" to a known data type in the app. Maybe it's a typo? Please check your input and try again.`,
                type: CodyResponseType.Error
              })
            }

            const {desc} = propRefInfo;

            if(isStateDescription(desc)) {
              const matchingListVOs = Object.values(config.types)
                .filter(t => isListDescription(t.desc) && t.desc.itemType === desc.name);

              if(matchingListVOs.length > 0) {
                propJsonSchema.$ref = `${propJsonSchema.$ref}:${desc.identifier}`;

                const firstMatch = matchingListVOs[0];

                if(!itemUiSchema[prop] || !itemUiSchema[prop]['ui:widget']) {
                  itemUiSchema[prop] = merge(itemUiSchema[prop] || {}, {
                    'ui:widget': 'DataSelect',
                    'ui:options': {
                      'data': registryIdToDataReference(firstMatch.desc.name),
                      'text': (new Schema(propRefInfo.schema as JSONSchema7, true))
                        .getDisplayNamePropertyCandidates().map(c => `data.${c}`).join(` + ' ' + `) || `data.${desc.identifier}`,
                      'value': `data.${desc.identifier}`
                    }
                  })

                  if(!itemUiSchema[prop]['ui:title']) {
                    itemUiSchema[prop]['ui:title'] = camelCaseToTitle(prop);
                  }
                }
              }
            }
          }

          itemSchema.setObjectProperty(prop, new Schema(propJsonSchema, true), schema.isRequired(prop));
        }

        if(!existingColumnNames.includes(prop)) {
          existingColumns.push(prop);
        }
      })
    } else {
      columnNames = input.replace(TEXT, '')
        .replaceAll(` and `, ',')
        .replaceAll(';', ',')
        .replaceAll(`- `, '')
        .split(",")
        .map(c => names(c.trim()));

      columnNames.forEach(c => {
        if(!itemSchema.getObjectPropertySchema(c.propertyName)) {
          itemSchema.setObjectProperty(c.propertyName, new Schema({type: "string", title: camelCaseToTitle(c.propertyName)}));
        }

        if(!existingColumnNames.includes(c.propertyName)) {
          existingColumns.push(c.propertyName)
        }
      })
    }

    const editedCtx = getEditedContextFromConfig(config);

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
        schema: withId(itemSchema.toJsonSchema(`/${serviceNames.fileName}/${ns.fileName}`), itemInfo.desc.name),
        uiSchema: itemUiSchema,
        factory: itemInfo.factory,
      },
      definition: {
        definitionId: playDefinitionIdFromFQCN(itemInfo.desc.name),
        schema: withId(itemSchema.toJsonSchema(`/${serviceNames.fileName}/${ns.fileName}`), itemInfo.desc.name),
      }
    });

    return {
      cody: `Alright, I've added the columns.`
    }
  }
}

export const getTableViewVO = (page: PlayPageDefinition, config: CodyPlayConfig): PlayInformationRuntimeInfo | null => {
  if(!page.components.length) {
    return null;
  }

  const tables: PlayInformationRuntimeInfo[] = [];

  for (const component of page.components) {
    const viewName = typeof component === "string" ? component : component.view;

    const view = config.views[viewName];

    if(typeof view === "object" && view.information) {
      if(!config.types[view.information]) {
        return null;
      }

      const voRuntimeInfo = config.types[view.information];

      if(isQueryableStateListDescription(voRuntimeInfo.desc)) {
        tables.push(voRuntimeInfo)
      }
    }
  }

  if(tables.length === 1) {
    return tables.pop() as PlayInformationRuntimeInfo;
  }

  return null;
}
