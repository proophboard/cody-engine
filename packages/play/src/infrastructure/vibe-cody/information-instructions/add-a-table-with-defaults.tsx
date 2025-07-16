import {CodyInstructionResponse, Instruction} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {CodyResponseType, NodeType} from "@proophboard/cody-types";
import {
  playMakeNodeRecordWithDefaults
} from "@cody-play/infrastructure/cody/node-traversing/play-make-node-record-with-defaults";
import {PlayValueObjectMetadataRaw} from "@cody-play/infrastructure/cody/vo/play-vo-metadata";
import {names} from "@event-engine/messaging/helpers";
import {onNode} from "@cody-play/infrastructure/cody/hooks/on-node";
import {getEditedContextFromConfig} from "@cody-play/state/config-store";
import {VibeCodyContext} from "@cody-play/infrastructure/vibe-cody/VibeCodyContext";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {AddColumnsToTable} from "@cody-play/infrastructure/vibe-cody/information-instructions/add-columns-to-table";
import {TableLarge} from "mdi-material-ui";
import {playNodeLabel} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import {withNavigateToProcessing} from "@cody-play/infrastructure/vibe-cody/utils/navigate/with-navigate-to-processing";
import {getRouteParamsFromRoute} from "@cody-play/infrastructure/vibe-cody/utils/navigate/get-route-params-from-route";
import {AndFilter, Filter} from "@app/shared/value-object/query/filter-types";
import {toSingularItemName} from "@event-engine/infrastructure/nlp/to-singular";
import {getLabelFromInstruction} from "@cody-play/infrastructure/vibe-cody/utils/text/get-label-from-instruction";

const TEXT = "I'd like to see a table of ";

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

    const tableFQCN = `${names(config.defaultService).className}.App.${tableNameNames.className}`;

    if(config.types[tableFQCN]) {
      return {
        cody: `Can't add a new table called "${tableName}", because the data type name "${tableFQCN}" would conflict with an existing data type name.`,
        details: `If you want to reuse the existing data type, give the table another name and reference the existing data type in the "Information Flow" view, that you can access from the level dropdown in the top right corner of the page.`,
        type: CodyResponseType.Error
      }
    }

    const routeParams = getRouteParamsFromRoute(pageConfig.route);

    const items: Record<string, string> = {
      [voIdentifier]: "string|format:uuid"
    }
    const query: Record<string, string> = {};
    let filter: Filter = {any: true};

    routeParams.forEach(p => {
      items[p] = "string|format:uuid";
      query[p] = "string|format:uuid";
    });

    if(routeParams.length === 1) {
      filter = {eq: {prop: routeParams[0], value: `$> query.${routeParams[0]}`}};
    } else if (routeParams.length >1) {
      filter = {and: []};

      routeParams.forEach(p => {
        (filter as AndFilter).and.push({eq: {prop: p, value: `$> query.${p}`}})
      })
    }

    const metadata: PlayValueObjectMetadataRaw = {
      identifier: voIdentifier,
      hasIdentifier: true,
      ns: "App",
      schema: {
        "$items": items
      },
      uiSchema: {
        "ui:table": {
          "columns": [

          ]
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

    const res = await onNode(node, dispatch, getEditedContextFromConfig(config), config);

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
