import {Instruction} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {getTableViewVO} from "@cody-play/infrastructure/vibe-cody/information-instructions/add-columns-to-table";
import {CodyResponse, CodyResponseType, NodeType} from "@proophboard/cody-types";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import {isInlineItemsArraySchema} from "@app/shared/utils/schema-checks";
import {names} from "@event-engine/messaging/helpers";
import {playDefinitionIdFromFQCN} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import {UiSchema} from "@rjsf/utils";
import {isQueryableStateListDescription} from "@event-engine/descriptions/descriptions";
import {onNode} from "@cody-play/infrastructure/cody/hooks/on-node";
import {
  playMakeNodeRecordWithDefaults
} from "@cody-play/infrastructure/cody/node-traversing/play-make-node-record-with-defaults";
import {getEditedContextFromConfig} from "@cody-play/state/config-store";
import {RawCommandMeta} from "@cody-play/infrastructure/cody/command/play-command-metadata";
import {EventMetaRaw} from "@cody-play/infrastructure/cody/event/play-event-metadata";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {now} from "@cody-engine/cody/hooks/utils/time";
import {convertNodeToJs} from "@cody-play/infrastructure/cody/node-traversing/convert-node-to-js";
import {Action, CommandAction} from "@frontend/app/components/core/form/types/action";
import {registryIdToDataReference} from "@app/shared/utils/registry-id-to-data-reference";
import {PlusBoxOutline} from "mdi-material-ui";

const TEXT = "Place a button above the table to add a ";

export const AddTableItem: Instruction = {
  text: TEXT,
  icon: <PlusBoxOutline />,
  isActive: (context, config) => !context.focusedElement && !!getTableViewVO(context.page.handle.page, config),
  match: input => input.startsWith(TEXT),
  execute: async (input, ctx, dispatch, config): Promise<CodyResponse> => {
    const btnLabel = input.replace(TEXT, '').trim();
    const cmdName = `Add ${btnLabel}`;
    const eventName = `${btnLabel} Added`;

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

    // @TODO: handle ref items
    if(!isInlineItemsArraySchema(tableVoSchema)) {
      return {
        cody: `I can't add a button to the table, because the schema of the view component ${tableVO.desc.name} is not an array schema (no items property defined).`,
        type: CodyResponseType.Error,
        details: `There seems to be something wrong with your Cody Play configuration of the page. Please have a look at the Cody Play tab in the Backend dialog.`
      }
    }

    const itemInfo = config.types[tableVO.desc.name + 'Item'];

    if(!itemInfo) {
      return {
        cody: `I can't add a button to the table. I found the information schema for the table ${tableVO.desc.name}, but not the schema for the column items. There should be a schema with name "${tableVO.desc.name}Item" registered in the types section of the Cody Play Config, but there is none.`
      }
    }

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
        cody: `I can't install the possibility to add a ${btnLabel}. The information shown in the table is not a list of objects with a configured identifier.`,
        type: CodyResponseType.Error,
        details: `Please switch to prooph board and design a command by hand.`
      }
    }

    cmdUiSchema[desc.itemIdentifier] = {
      "ui:widget": "hidden"
    };

    cmdUiSchema["ui:form"] = {
      "data": {
        [desc.itemIdentifier]: " uuid()"
      }
    }

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

    // Add event projection case
    dispatch({
      ctx: editedCtx,
      type: "ADD_EVENT_POLICY",
      name: prjName,
      event: `${names(config.defaultService).className}.${names(eventName).className}`,
      desc: {
        _pbLink: tableVO.desc._pbLink,
        _pbBoardId: tableVO.desc._pbBoardId,
        _pbCardId: tableVO.desc._pbCardId,
        _pbCreatedAt: tableVO.desc._pbCreatedAt,
        _pbCreatedBy: tableVO.desc._pbCreatedBy,
        _pbLastUpdatedAt: now(),
        _pbLastUpdatedBy: editedCtx.userId,
        _pbVersion: 1,
        name: prjName,
        rules: [
          {
            rule: "always",
            then: {
              upsert: {
                information: tableVO.desc.name,
                id: ` event.${desc.itemIdentifier}`,
                set: " event"
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
              mapping: ` command`
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

    if(!tableVoUiSchema['ui:options']) {
      tableVoUiSchema['ui:options'] = {}
    }

    if(!tableVoUiSchema['ui:options']['actions']) {
      tableVoUiSchema['ui:options']['actions'] = [];
    }

    const actions: Partial<CommandAction>[] = tableVoUiSchema['ui:options']['actions'] as Action[];

    actions.push({
      type: "command",
      position: "top-right",
      command: `${names(config.defaultService).className}.${names(cmdName).className}`,
      button: {
        label: btnLabel,
        icon: "plus"
      } as any
    })

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
      cody: `The button is in place. It opens a form dialog to enter the data for a new ${btnLabel}.`,
      details: `To adjust the form dialog or the processing logic, keep the dialog open and provide me with appropriate instructions.`
    }
  }
}
