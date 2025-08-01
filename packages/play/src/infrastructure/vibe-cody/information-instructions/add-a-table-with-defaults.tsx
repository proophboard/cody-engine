import {CodyInstructionResponse, Instruction} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {CodyResponseType, NodeType} from "@proophboard/cody-types";
import {
  playMakeNodeRecordWithDefaults
} from "@cody-play/infrastructure/cody/node-traversing/play-make-node-record-with-defaults";
import {PlayValueObjectMetadataRaw} from "@cody-play/infrastructure/cody/vo/play-vo-metadata";
import {names} from "@event-engine/messaging/helpers";
import {onNode} from "@cody-play/infrastructure/cody/hooks/on-node";
import {cloneConfig, getEditedContextFromConfig} from "@cody-play/state/config-store";
import {VibeCodyContext} from "@cody-play/infrastructure/vibe-cody/VibeCodyContext";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {AddColumnsToTable} from "@cody-play/infrastructure/vibe-cody/information-instructions/add-columns-to-table";
import {TableLarge} from "mdi-material-ui";
import {playDefinitionIdFromFQCN, playNodeLabel} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import {withNavigateToProcessing} from "@cody-play/infrastructure/vibe-cody/utils/navigate/with-navigate-to-processing";
import {getRouteParamsFromRoute} from "@cody-play/infrastructure/vibe-cody/utils/navigate/get-route-params-from-route";
import {AndFilter, Filter} from "@app/shared/value-object/query/filter-types";
import {toSingularItemName} from "@event-engine/infrastructure/nlp/to-singular";
import {getLabelFromInstruction} from "@cody-play/infrastructure/vibe-cody/utils/text/get-label-from-instruction";
import {
  findDataSelectTypeForRouteParam
} from "@cody-play/infrastructure/vibe-cody/utils/types/find-data-select-type-for-route-param";
import {uiReadOnly} from "@cody-play/infrastructure/vibe-cody/utils/ui-schema/ui-read-only";
import {
  makeDataSelectWidgetConfig
} from "@cody-play/infrastructure/vibe-cody/utils/ui-schema/make-data-select-widget-config";
import {playUpdateProophBoardInfo} from "@cody-play/infrastructure/cody/pb-info/play-update-prooph-board-info";
import {Schema} from "@cody-play/infrastructure/vibe-cody/utils/schema/schema";

const TEXT = "Add a table of ";

export const AddATableWithDefaults: Instruction = {
  text: TEXT,
  icon: <TableLarge />,
  isActive: context => !context.focusedElement && context.page.pathname !== '/welcome',
  match: input => input.startsWith(TEXT),
  execute: withNavigateToProcessing(async (input, ctx: VibeCodyContext, dispatch, config, navigateTo): Promise<CodyInstructionResponse> => {
    const pageConfig = ctx.page.handle.page;
    const tableName = getLabelFromInstruction(input, TEXT);
    const tableNameNames = names(tableName);
    const itemNames = names(toSingularItemName(tableName));
    const voIdentifier = itemNames.propertyName + 'Id';
    const configCopy = cloneConfig(config);

    const tableFQCN = `${names(config.defaultService).className}.App.${tableNameNames.className}`;
    const itemFQCN = `${names(config.defaultService).className}.App.${itemNames.className}`;

    if(config.types[tableFQCN]) {
      return {
        cody: `Can't add a new table called "${tableName}", because the data type name "${tableFQCN}" would conflict with an existing data type name.`,
        details: `If you want to reuse the existing data type, give the table another name and reference the existing data type.\n\nFocus on the table and start your prompt with "reference" to get prompt suggestion.`,
        type: CodyResponseType.Error
      }
    }

    if(config.types[itemFQCN]) {
      return {
        cody: `Can't add a new table called "${tableName}", because the row data type name "${itemFQCN}" would conflict with an existing data type name.`,
        details: `If you want to reuse the existing data type, give the table another name and reference the existing data type.\n\nFocus on the table and start your prompt with "reference" to get prompt suggestion.`,
        type: CodyResponseType.Error
      }
    }

    const routeParams = getRouteParamsFromRoute(pageConfig.route);

    const itemSchema = {
      [voIdentifier]: "string|format:uuid"
    }

    const items: Record<string, string> = {
      $items: `/App/${itemNames.className}`
    }
    const query: Record<string, string> = {};
    let filter: Filter = {any: true};
    let itemsUiSchema: Record<string, any> = {};
    const columns: string[] = [];

    routeParams.forEach(p => {
      const dataSelectType = findDataSelectTypeForRouteParam(p, pageConfig.route, config);

      itemSchema[p] = "string|format:uuid";
      query[p] = "string|format:uuid";
      itemsUiSchema[p] = dataSelectType
        ? uiReadOnly(makeDataSelectWidgetConfig(dataSelectType, config))
        : {"ui:widget": "hidden"};

      if(dataSelectType) {
        columns.push(p);
      }
    });

    if(routeParams.length === 1) {
      filter = {eq: {prop: routeParams[0], value: `$> query.${routeParams[0]}`}};
    } else if (routeParams.length >1) {
      filter = {and: []};

      routeParams.forEach(p => {
        (filter as AndFilter).and.push({eq: {prop: p, value: `$> query.${p}`}})
      })
    }

    const itemMetadata: PlayValueObjectMetadataRaw = {
      identifier: voIdentifier,
      hasIdentifier: true,
      ns: "App",
      schema: itemSchema,
      uiSchema: itemsUiSchema,
      querySchema: {
        [voIdentifier]: "string|format:uuid"
      },
      collection: `${tableNameNames.constantName.toLowerCase()}_collection`,
    }

    const itemNode = playMakeNodeRecordWithDefaults(
      {
        name: itemNames.className,
        type: NodeType.document,
        metadata: JSON.stringify(itemMetadata),
      },
      config
    )

    const itemRes = await onNode(itemNode, dispatch, getEditedContextFromConfig(config), config);

    if(playIsCodyError(itemRes)) {
      return itemRes;
    }

    // Register the item type in the config, so that the reference can be resolved
    configCopy.types[itemFQCN] = {
      desc: {
        name: itemFQCN,
        query: `App.Get${itemNames.className}`,
        identifier: voIdentifier,
        collection: itemMetadata.collection as string,
        isList: false,
        hasIdentifier: true,
        isQueryable: true,
        ...playUpdateProophBoardInfo(itemNode, getEditedContextFromConfig(config), undefined)
      },
      schema: (new Schema(itemSchema)).toJsonSchema(),
      uiSchema: itemsUiSchema,
      factory: []
    }

    configCopy.definitions[playDefinitionIdFromFQCN(itemFQCN)] = (new Schema(itemSchema)).toJsonSchema()

    const metadata: PlayValueObjectMetadataRaw = {
      identifier: voIdentifier,
      hasIdentifier: true,
      ns: "App",
      schema: items,
      uiSchema: {
        "ui:table": {
          "columns": columns
        }
      },
      querySchema: query,
      resolve: {
        where: {
          rule: "always",
          then: {
            filter: filter,
          }
        }
      },
      projection: {
        name: `${tableNameNames.className}Projection`,
        live: true,
        cases: []
      },
      collection: `${tableNameNames.constantName.toLowerCase()}_collection`,
    }

    const node = playMakeNodeRecordWithDefaults(
      {
        name: tableName,
        type: NodeType.document,
        metadata: JSON.stringify(metadata),
      },
      config
    )

    const res = await onNode(node, dispatch, getEditedContextFromConfig(config), configCopy);

    if(playIsCodyError(res)) {
      return res;
    }



    dispatch({
      ctx: getEditedContextFromConfig(config),
      type: "ADD_PAGE",
      page: {...pageConfig, components: [...pageConfig.components, `${config.defaultService}.${tableNameNames.className}`]},
      name: pageConfig.name
    })

    return {
      cody: `Added a ${tableName} table to the page ${playNodeLabel(pageConfig.name)}.`,
      details: `Do you want to define the columns for the table? Just give me a comma separated list of column names.\n\nHint: You can also use a bullet point list.`,
      type: CodyResponseType.Question,
      instructionReply: async (input: string, ctx, dispatch, config, navigateTo) => {
        return AddColumnsToTable.execute(input, ctx, dispatch, config, navigateTo);
      }
    }
  })
}
