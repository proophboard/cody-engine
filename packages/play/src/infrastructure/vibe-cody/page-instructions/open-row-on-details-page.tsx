import {Instruction} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {PageNextOutline} from "mdi-material-ui";
import {VibeCodyContext} from "@cody-play/infrastructure/vibe-cody/VibeCodyContext";
import {CodyResponse, CodyResponseType, NodeType} from "@proophboard/cody-types";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import {isJsonSchemaArray} from "@cody-play/infrastructure/vibe-cody/utils/json-schema/is-json-schema-array";
import {
  ListDescription,
  QueryableStateListDescription,
  StateDescription
} from "@event-engine/descriptions/descriptions";
import {names} from "@event-engine/messaging/helpers";
import {playDefinitionIdFromFQCN, playNodeLabel} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import {PlaySubLevelPage, PlayTopLevelPage} from "@cody-play/state/types";
import {getEditedContextFromConfig} from "@cody-play/state/config-store";
import {ActionTableColumn} from "@cody-engine/cody/hooks/utils/value-object/types";
import {isActionsColumn} from "@cody-play/infrastructure/vibe-cody/utils/table/is-actions-column";
import {PlayValueObjectMetadataRaw} from "@cody-play/infrastructure/cody/vo/play-vo-metadata";
import {
  playMakeNodeRecordWithDefaults
} from "@cody-play/infrastructure/cody/node-traversing/play-make-node-record-with-defaults";
import {onNode} from "@cody-play/infrastructure/cody/hooks/on-node";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {withNavigateToProcessing} from "@cody-play/infrastructure/vibe-cody/utils/navigate/with-navigate-to-processing";
import {getRouteParamsFromRoute} from "@cody-play/infrastructure/vibe-cody/utils/navigate/get-route-params-from-route";
import {isTableFocused} from "@cody-play/infrastructure/vibe-cody/utils/types/is-table-focused";
import {
  getFocusedQueryableStateListVo
} from "@cody-play/infrastructure/vibe-cody/utils/types/get-focused-queryable-state-list-vo";
import {
  makeDynamicPageTitleForStateType
} from "@cody-play/infrastructure/vibe-cody/utils/page/make-dynamic-page-title-for-state-type";

const TEXT = `I want to open a row on a details page`;

export const OpenRowOnDetailsPage: Instruction = {
  text: TEXT,
  icon: <PageNextOutline />,
  noInputNeeded: true,
  isActive: (context, config) => isTableFocused(context.focusedElement, context.page.handle.page, config),
  match: input => input.startsWith(TEXT),
  execute: withNavigateToProcessing(async (input: string, ctx: VibeCodyContext, dispatch, config, navigateTo): Promise<CodyResponse> => {
    const pageConfig = ctx.page.handle.page;

    const tableVO = getFocusedQueryableStateListVo(ctx.focusedElement, pageConfig, config);

    if(playIsCodyError(tableVO)) {
      return tableVO;
    }

    const tableVoSchema = cloneDeepJSON(tableVO.schema);
    let tableVoUiSchema = cloneDeepJSON(tableVO.uiSchema);

    if(!isJsonSchemaArray(tableVoSchema)) {
      return {
        cody: `I can't add a button to the table, because the schema of the view component ${tableVO.desc.name} is not an array schema (no items property defined).`,
        type: CodyResponseType.Error,
        details: `There seems to be something wrong with your Cody Play configuration of the page. Please have a look at the Cody Play tab in the Backend dialog.`
      }
    }

    const itemInfo = config.types[(tableVO.desc as ListDescription).itemType];

    if(!itemInfo) {
      return {
        cody: `I can't add a button to the table. I found the information schema for the table ${tableVO.desc.name}, but not the schema for the rows. There should be a schema with name "${(tableVO.desc as ListDescription).itemType}" registered in the types section of the Cody Play Config, but there is none.`,
        type: CodyResponseType.Error
      }
    }

    if(!itemInfo.desc.hasIdentifier) {
      return {
        cody: `I can't add a link to a details page, because the row data type "${itemInfo.desc.name}" has no identifier property configured in its type description.`,
        type: CodyResponseType.Error,
        details: `Without a row identifier, I can't construct a proper link. Either you're going to reconfigure the table, or you use the possibilities on prooph board to configure the table columns configuration in the uiSchema and construct the page link by hand.`
      }
    }

    const itemLabelNames = names(playNodeLabel(itemInfo.desc.name));

    const pageName = `${itemLabelNames.className}Details`;
    const pageFQCN = `${names(config.defaultService).className}.${names(pageName).className}`;
    const newPageRoute = `${pageConfig.route}/:${(itemInfo.desc as StateDescription).identifier}`;
    const viewName = `${names(config.defaultService).className}.${itemLabelNames.className}`;
    const itemIdentifier = (itemInfo.desc as StateDescription).identifier;
    const editedCtx = getEditedContextFromConfig(config);

    if(!config.views[viewName]) {
      const metadata: PlayValueObjectMetadataRaw = {
        identifier: itemIdentifier,
        hasIdentifier: true,
        ns: "App",
        schema: itemInfo.schema,
        uiSchema: itemInfo.uiSchema,
        shorthand: false,
        querySchema: {
          type: "object",
          properties: {
            [itemIdentifier]: itemInfo.schema.properties? itemInfo.schema.properties[itemIdentifier] : {type: "string", "format": "uuid"},
          },
          additionalProperties: false,
          required: [itemIdentifier]
        },
        resolve: {
          where: {
            rule: "always",
            then: {
              filter: {
                docId: `$> query.${itemIdentifier}`
              }
            }
          }
        },
        collection: `${(tableVO.desc as QueryableStateListDescription).collection}`,
      }

      const node = playMakeNodeRecordWithDefaults(
        {
          name: playNodeLabel(itemInfo.desc.name),
          type: NodeType.document,
          metadata: JSON.stringify(metadata),
        },
        config
      )

      const res = await onNode(node, dispatch, editedCtx, config);

      if(playIsCodyError(res)) {
        return res;
      }
    }

    const page:PlaySubLevelPage = {
      name: pageFQCN,
      service: config.defaultService,
      route: newPageRoute,
      "title:expr": makeDynamicPageTitleForStateType(itemInfo),
      commands: [],
      components: [viewName],
      topLevel: false,
      breadcrumb: playNodeLabel(itemInfo.desc.name),
      routeParams: getRouteParamsFromRoute(newPageRoute)
    };

    dispatch({
      ctx: editedCtx,
      type: "ADD_PAGE",
      page,
      name: pageFQCN
    });

    // We have to wait until env is updated with new page (50ms)
    return new Promise(async (resolve) => {
      window.setTimeout(async () => {
        if(!tableVoUiSchema) {
          tableVoUiSchema = {};
        }

        if(!tableVoUiSchema['ui:table']) {
          tableVoUiSchema['ui:table'] = {};
        }

        if(!tableVoUiSchema['ui:table']['columns']) {
          tableVoUiSchema['ui:table']['columns'] = [];
        }

        let lastCol = tableVoUiSchema['ui:table']['columns'].pop();

        const detailsLinkAction: ActionTableColumn & {
          pageLink: {page: string; mapping: Record<string, string>};
        } = {
          type: 'link',
          pageLink: {
            page: pageFQCN,
            mapping: {
              [itemIdentifier]: `$> row.${itemIdentifier}`
            }
          },
          button: {
            label: `View Details`,
            icon: 'open-in-new',
            color: 'default'
          }
        }

        if(lastCol && isActionsColumn(lastCol) && typeof lastCol === "object") {
          if(!lastCol.actions) {
            lastCol.actions = [];
          }

          lastCol.actions.push(detailsLinkAction);
        } else {
          if(lastCol) {
            // Push back last col, before adding a new actions col
            tableVoUiSchema['ui:table']['columns'].push(lastCol);
          }

          lastCol = {
            field: 'actions',
            type: 'actions',
            actions: [
              detailsLinkAction
            ]
          }
        }

        tableVoUiSchema['ui:table']['columns'].push(lastCol!);

        // Update Table VO
        dispatch({
          ctx: editedCtx,
          type: "ADD_TYPE",
          name: tableVO.desc.name,
          information: {
            ...tableVO,
            uiSchema: tableVoUiSchema
          },
          definition: {
            definitionId: playDefinitionIdFromFQCN(tableVO.desc.name),
            schema: tableVoSchema
          }
        });

        resolve({
          cody: `No problem, you can now open a ${playNodeLabel(itemInfo.desc.name)} by clicking on the "open-in-new" icon at the end of the row.`
        })
      }, 100);
    })
  })
}
