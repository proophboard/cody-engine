import {CodyInstructionResponse, Instruction} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {CodyResponse, CodyResponseType, NodeType} from "@proophboard/cody-types";
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
import { TableLarge } from "mdi-material-ui";

const TEXT = "I'd like to see a table of ";

export const AddATableWithDefaults: Instruction = {
  text: TEXT,
  icon: <TableLarge />,
  isActive: context => !context.focusedElement && context.page.pathname !== '/welcome',
  match: input => input.startsWith(TEXT),
  execute: async (input, ctx: VibeCodyContext, dispatch, config, navigateTo): Promise<CodyInstructionResponse> => {
    const tableName = input.replace(TEXT, '').trim();
    const tableNameNames = names(tableName);
    const voIdentifier = tableNameNames.propertyName + 'ItemId';

    const metadata: PlayValueObjectMetadataRaw = {
      identifier: voIdentifier,
      hasIdentifier: true,
      ns: "App",
      schema: {
        "$items": {
          [voIdentifier]: "string|format:uuid"
        }
      },
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

    const res = await onNode(node, dispatch, getEditedContextFromConfig(config), config);

    if(playIsCodyError(res)) {
      return res;
    }

    const pageConfig = ctx.page.handle.page;

    return new Promise((resolve, reject) => {
      navigateTo('/welcome');

      setTimeout(() => {
        dispatch({
          ctx: getEditedContextFromConfig(config),
          type: "ADD_PAGE",
          page: {...pageConfig, components: [...pageConfig.components, `${config.defaultService}.${tableNameNames.className}`]},
          name: pageConfig.name
        })

        navigateTo(ctx.page.pathname);

        resolve({
          cody: `Added a ${tableName} table to the page ${pageConfig.name}.`,
          details: `Do you want to define the columns for the table? Just give me a comma separated list of column names.`,
          type: CodyResponseType.Question,
          instructionReply: async (input: string, ctx, dispatch, config, navigateTo) => {
            return AddColumnsToTable.execute(input, ctx, dispatch, config, navigateTo);
          }
        })
      }, 100)
    })
  }
}
