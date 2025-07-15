import {Instruction} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {CodyResponse, CodyResponseType, NodeType} from "@proophboard/cody-types";
import {TableRowRemove} from "mdi-material-ui";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import {isJsonSchemaArray} from "@cody-play/infrastructure/vibe-cody/utils/json-schema/is-json-schema-array";
import {registryIdToDataReference} from "@app/shared/utils/registry-id-to-data-reference";
import {names} from "@event-engine/messaging/helpers";
import {playDefinitionIdFromFQCN, playNodeLabel} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import {getEditedContextFromConfig} from "@cody-play/state/config-store";
import {EventMetaRaw} from "@cody-play/infrastructure/cody/event/play-event-metadata";
import {
  playMakeNodeRecordWithDefaults
} from "@cody-play/infrastructure/cody/node-traversing/play-make-node-record-with-defaults";
import {onNode} from "@cody-play/infrastructure/cody/hooks/on-node";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {now} from "@cody-engine/cody/hooks/utils/time";
import {RawCommandMeta} from "@cody-play/infrastructure/cody/command/play-command-metadata";
import {convertNodeToJs} from "@cody-play/infrastructure/cody/node-traversing/convert-node-to-js";
import {JSONSchema7} from "json-schema";
import {
  playGetProophBoardInfoFromDescription
} from "@cody-play/infrastructure/cody/pb-info/play-update-prooph-board-info";
import {Action, CommandAction} from "@frontend/app/components/core/form/types/action";
import {isTableFocused} from "@cody-play/infrastructure/vibe-cody/utils/types/is-table-focused";
import {
  getFocusedQueryableStateListVo
} from "@cody-play/infrastructure/vibe-cody/utils/types/get-focused-queryable-state-list-vo";

const TEXT = `I want to select rows and delete them.`;

export const BatchDeleteRows: Instruction = {
  text: TEXT,
  icon: <TableRowRemove />,
  noInputNeeded: true,
  isActive: (context, config) => isTableFocused(context.focusedElement, context.page.handle.page, config),
  match: input => input.startsWith(TEXT),
  execute: async (input, ctx, dispatch, config): Promise<CodyResponse> => {
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

    const tableLabelNames = names(playNodeLabel(tableVO.desc.name));

    const cmdName = `Delete ${tableLabelNames.name}`;

    const cmdSchema = {
      type: "object",
      additionalProperties: false,
      properties: {
        [tableLabelNames.propertyName]: {
          type: 'array',
          items: {
            type: 'string',
            format: 'uuid'
          }
        }
      },
      required: [tableLabelNames.propertyName],
      title: cmdName
    };

    const eventName = `${tableLabelNames.name} Deleted`;

    const eventSchema = {
      ...cmdSchema,
      title: eventName
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
              delete: {
                information: tableVO.desc.name,
                filter: {
                  anyOfDocId: `$> event.${tableLabelNames.propertyName}`
                }
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
      schema: cmdSchema as JSONSchema7,
      uiSchema: {},
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

    if(!tableVoUiSchema['ui:options']) {
      tableVoUiSchema['ui:options'] = {}
    }

    if(!tableVoUiSchema['ui:options']['actions']) {
      tableVoUiSchema['ui:options']['actions'] = [];
    }

    if(!tableVoUiSchema['ui:table']) {
      tableVoUiSchema['ui:table'] = {};
    }

    tableVoUiSchema['ui:table']!.checkboxSelection = true;

    const actions: Partial<CommandAction>[] = tableVoUiSchema['ui:options']['actions'] as Action[];

    actions.push({
      type: "command",
      directSubmit: true,
      position: "bottom-left",
      command: `${names(config.defaultService).className}.${names(cmdName).className}`,
      data: {
        [tableLabelNames.propertyName]: `$> page|data('${registryIdToDataReference(tableVO.desc.name)}/Selection', [])`
      },
      button: {
        label: `Delete`,
        variant: 'outlined',
        icon: "trash-can-outline",
        'disabled:expr': `$> page|data('${registryIdToDataReference(tableVO.desc.name)}/Selection', [])|count() == 0`
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
      cody: `You'll find a delete button below the table. It's disabled as long as you don't select a row.`
    }
  }
}
