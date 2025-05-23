import {Instruction} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {getTableViewVO} from "@cody-play/infrastructure/vibe-cody/information-instructions/add-columns-to-table";
import {PencilPlusOutline} from "mdi-material-ui";
import {CodyResponseType, NodeType} from "@proophboard/cody-types";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import {isJsonSchemaArray} from "@cody-play/infrastructure/vibe-cody/utils/json-schema/is-json-schema-array";
import {isQueryableStateListDescription, ListDescription} from "@event-engine/descriptions/descriptions";
import {playDefinitionIdFromFQCN, playNodeLabel} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import {names} from "@event-engine/messaging/helpers";
import {registryIdToDataReference} from "@app/shared/utils/registry-id-to-data-reference";
import {UiSchema} from "@rjsf/utils";
import {getEditedContextFromConfig} from "@cody-play/state/config-store";
import {EventMetaRaw} from "@cody-play/infrastructure/cody/event/play-event-metadata";
import {
  playMakeNodeRecordWithDefaults
} from "@cody-play/infrastructure/cody/node-traversing/play-make-node-record-with-defaults";
import {onNode} from "@cody-play/infrastructure/cody/hooks/on-node";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {
  playGetProophBoardInfoFromDescription
} from "@cody-play/infrastructure/cody/pb-info/play-update-prooph-board-info";
import {now} from "@cody-engine/cody/hooks/utils/time";
import {RawCommandMeta} from "@cody-play/infrastructure/cody/command/play-command-metadata";
import {convertNodeToJs} from "@cody-play/infrastructure/cody/node-traversing/convert-node-to-js";
import {CommandAction} from "@frontend/app/components/core/form/types/action";
import {ActionTableColumn} from "@cody-engine/cody/hooks/utils/value-object/types";
import {PropMapping} from "@app/shared/rule-engine/configuration";
import {isActionsColumn} from "@cody-play/infrastructure/vibe-cody/utils/table/is-actions-column";

const TEXT = `Place an edit button at the end of each table row`;

export const EditTableItem: Instruction = {
  text: TEXT,
  icon: <PencilPlusOutline />,
  noInputNeeded: true,
  isActive: (context, config) => !context.focusedElement && !!getTableViewVO(context.page.handle.page, config),
  match: input => input.startsWith(TEXT),
  execute: async (input, ctx, dispatch, config, navigateTo) => {
    const pageConfig = ctx.page.handle.page;

    const tableVO = getTableViewVO(pageConfig, config);

    if(!tableVO) {
      return {
        cody: `I can't find a table on the page ${pageConfig.name}`,
        type: CodyResponseType.Error
      }
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
        cody: `I can't add a button to the table. I found the information schema for the table ${tableVO.desc.name}, but not the schema for the rows. There should be a schema with name "${(tableVO.desc as ListDescription).itemType}" registered in the types section of the Cody Play Config, but there is none.`
      }
    }

    const itemLabelNames = names(playNodeLabel(itemInfo.desc.name));

    const cmdName = `Add ${itemLabelNames.name}`;
    const eventName = `${itemLabelNames.name} Added`;

    const cmdSchema = {
      $ref: registryIdToDataReference(itemInfo.desc.name),
    }

    const desc = tableVO.desc;

    const cmdUiSchema: UiSchema = {
      "ui:button": {
        "label": "save",
        "icon": "zip-disk"
      }
    };

    if(!isQueryableStateListDescription(desc)) {
      return {
        cody: `I can't install the possibility to edit a ${itemLabelNames.name}. The information shown in the table is not a list of objects with a configured identifier.`,
        type: CodyResponseType.Error,
        details: `Please switch to prooph board and design a command by hand.`
      }
    }

    cmdUiSchema[desc.itemIdentifier] = {
      "ui:widget": "hidden"
    };

    const editedCtx = getEditedContextFromConfig(config);

    // First add a new event and let the tableVO projection handle the event
    const eventMeta: EventMetaRaw = {
      schema: cmdSchema
    }

    const eventNode = playMakeNodeRecordWithDefaults({
      name: `${eventName}`,
      type: NodeType.event,
      metadata: JSON.stringify(eventMeta)
    }, config);

    const eventRes = await onNode(eventNode, dispatch, editedCtx, config);

    if(playIsCodyError(eventRes)) {
      return eventRes;
    }

    const prjName = tableVO.desc.projection || `${tableVO.desc.name.split('.').pop()}Projection`;

    const pbInfo = playGetProophBoardInfoFromDescription(tableVO.desc);

    // Add event projection case
    dispatch({
      ctx: editedCtx,
      type: "ADD_EVENT_POLICY",
      name: prjName,
      event: `${names(config.defaultService).className}.${names(eventName).className}`,
      desc: {
        ...pbInfo,
        _pbLastUpdatedAt: now(),
        _pbLastUpdatedBy: editedCtx.userId,
        _pbVersion: pbInfo._pbVersion + 1,
        name: prjName,
        rules: [
          {
            rule: "always",
            then: {
              upsert: {
                information: tableVO.desc.name,
                id: `$> event.${desc.itemIdentifier}`,
                set: "$> event"
              }
            }
          }
        ],
        dependencies: {},
        live: true,
        projection: prjName
      }
    })

    const cmdMeta: RawCommandMeta = {
      schema: cmdSchema,
      uiSchema: cmdUiSchema,
      aggregateCommand: false,
      rules: [
        {
          rule: "always",
          then: {
            record: {
              event: `${eventName}`,
              mapping: `$> command`
            }
          }
        }
      ]
    }

    const commandNode = playMakeNodeRecordWithDefaults(
      {
        name: cmdName,
        type: NodeType.command,
        metadata: JSON.stringify(cmdMeta),
        targetsList: [convertNodeToJs(eventNode)]
      },
      config
    )

    const cmdRes = await onNode(commandNode, dispatch, getEditedContextFromConfig(config), config);

    if(playIsCodyError(cmdRes)) {
      return cmdRes;
    }

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

    const editAction: ActionTableColumn & {command: string, data: PropMapping | string} = {
      type: 'command',
      command: `${names(config.defaultService).className}.${names(cmdName).className}`,
      data: `$> row`,
      button: {
        label: `Edit`,
        icon: 'pencil',
        color: 'inherit'
      }
    }

    if(lastCol && isActionsColumn(lastCol) && typeof lastCol === "object") {
      if(!lastCol.actions) {
        lastCol.actions = [];
      }

      lastCol.actions.push(editAction);
    } else {
      if(lastCol) {
        // Push back last col, before adding a new actions col
        tableVoUiSchema['ui:table']['columns'].push(lastCol);
      }

      lastCol = {
        field: 'actions',
        type: 'actions',
        actions: [
          editAction
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

    return {
      cody: `I've added an edit button (pencil icon) to the actions column of the table.`
    }
  }
}
