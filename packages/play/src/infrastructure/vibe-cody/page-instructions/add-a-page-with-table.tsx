import {Instruction} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {TableLarge} from "mdi-material-ui";
import {VibeCodyContext} from "@cody-play/infrastructure/vibe-cody/VibeCodyContext";
import {CodyResponse, NodeType} from "@proophboard/cody-types";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {names} from "@event-engine/messaging/helpers";
import {PlayTopLevelPage} from "@cody-play/state/types";
import {getEditedContextFromConfig} from "@cody-play/state/config-store";
import {PlayValueObjectMetadataRaw} from "@cody-play/infrastructure/cody/vo/play-vo-metadata";
import {
  playMakeNodeRecordWithDefaults
} from "@cody-play/infrastructure/cody/node-traversing/play-make-node-record-with-defaults";
import {onNode} from "@cody-play/infrastructure/cody/hooks/on-node";
import {toSingularItemName} from "@event-engine/infrastructure/nlp/to-singular";

const TEXT = "Add a new page with a table called ";

export const AddPageWithTable: Instruction = {
  text: TEXT,
  icon: <TableLarge />,
  isActive: context => !context.focusedElement,
  match: input => input.startsWith(TEXT),
  execute: async (input: string, ctx: VibeCodyContext, dispatch, config, navigateTo): Promise<CodyResponse> => {

    // Add a new page
    const pageName = input.replace(TEXT, "").trim();
    const pageFQCN = `${names(config.defaultService).className}.${names(pageName).className}`;
    const newPageRoute = `/${names(pageName).fileName}`;

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
