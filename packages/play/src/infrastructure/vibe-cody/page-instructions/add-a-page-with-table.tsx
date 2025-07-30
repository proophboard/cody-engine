import {Instruction} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {TableLarge} from "mdi-material-ui";
import {VibeCodyContext} from "@cody-play/infrastructure/vibe-cody/VibeCodyContext";
import {CodyResponse, CodyResponseType, NodeType} from "@proophboard/cody-types";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {names} from "@event-engine/messaging/helpers";
import {PlayTopLevelPage} from "@cody-play/state/types";
import {cloneConfig, getEditedContextFromConfig} from "@cody-play/state/config-store";
import {PlayValueObjectMetadataRaw} from "@cody-play/infrastructure/cody/vo/play-vo-metadata";
import {
  playMakeNodeRecordWithDefaults
} from "@cody-play/infrastructure/cody/node-traversing/play-make-node-record-with-defaults";
import {onNode} from "@cody-play/infrastructure/cody/hooks/on-node";
import {toSingularItemName} from "@event-engine/infrastructure/nlp/to-singular";
import {getLabelFromInstruction} from "@cody-play/infrastructure/vibe-cody/utils/text/get-label-from-instruction";
import {playUpdateProophBoardInfo} from "@cody-play/infrastructure/cody/pb-info/play-update-prooph-board-info";
import {Schema} from "@cody-play/infrastructure/vibe-cody/utils/schema/schema";
import {playDefinitionIdFromFQCN} from "@cody-play/infrastructure/cody/schema/play-definition-id";

const TEXT = "Add a new page with a table called ";

export const AddPageWithTable: Instruction = {
  text: TEXT,
  icon: <TableLarge />,
  isActive: context => !context.focusedElement,
  match: input => input.startsWith(TEXT),
  execute: async (input: string, ctx: VibeCodyContext, dispatch, config, navigateTo): Promise<CodyResponse> => {

    // Add a new page
    const pageName = getLabelFromInstruction(input, TEXT);
    const pageFQCN = `${names(config.defaultService).className}.${names(pageName).className}`;
    const newPageRoute = `/${names(pageName).fileName}`;
    const configCopy = cloneConfig(config);

    const page:PlayTopLevelPage = {
      name: pageFQCN,
      service: config.defaultService,
      route: newPageRoute,
      commands: [],
      components: [],
      topLevel: true,
      sidebar: {
        label: pageName,
        icon: 'square',
        position: 5
      },
      breadcrumb: pageName,
    };

    dispatch({
      ctx: getEditedContextFromConfig(config),
      type: "ADD_PAGE",
      page,
      name: pageFQCN
    });

    // Add a table to the new page
    const tableName = pageName;
    const tableNameNames = names(tableName);
    const itemNames = names(toSingularItemName(tableName));
    const voIdentifier = itemNames.propertyName + 'Id';
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

    const itemSchema = {
      [voIdentifier]: "string|format:uuid"
    }

    const items: Record<string, string> = {
      $items: `/App/${itemNames.className}`
    }

    const itemMetadata: PlayValueObjectMetadataRaw = {
      identifier: voIdentifier,
      hasIdentifier: true,
      ns: "App",
      schema: itemSchema,
      uiSchema: {},
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
      uiSchema: {},
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
          "columns": [

          ]
        }
      },
      querySchema: {

      },
      resolve: {
        where: {
          rule: "always",
          then: {
            filter: {
              any: true
            }
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

    const pageConfig = {...page, components: [...page.components, `${config.defaultService}.${tableNameNames.className}`]};

    dispatch({
      ctx: getEditedContextFromConfig(config),
      type: "ADD_PAGE",
      page: pageConfig,
      name: pageConfig.name
    })

    navigateTo(newPageRoute);

    return {
      cody: `Added a new page with a table that shows ${pageName}`,
    }
  }
}
