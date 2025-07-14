import {Instruction} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {PencilPlusOutline} from "mdi-material-ui";
import {CodyResponseType, NodeType} from "@proophboard/cody-types";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import {
  isQueryableStateDescription,
  QueryableStateListDescription
} from "@event-engine/descriptions/descriptions";
import {names} from "@event-engine/messaging/helpers";
import {playDefinitionIdFromFQCN, playNodeLabel} from "@cody-play/infrastructure/cody/schema/play-definition-id";
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
import {isStateViewFocused} from "@cody-play/infrastructure/vibe-cody/utils/types/is-state-view-focused";
import {findProjectionType} from "@cody-play/infrastructure/vibe-cody/utils/types/find-projection-type";
import {CommandAction} from "@frontend/app/components/core/form/types/action";
import {JSONSchema7} from "json-schema";

const TEXT = `Place an edit button above the view.`;

export const EditState: Instruction = {
  text: TEXT,
  icon: <PencilPlusOutline />,
  noInputNeeded: true,
  isActive: (context, config) => isStateViewFocused(context.focusedElement),
  match: input => input.startsWith(TEXT),
  execute: async (input, ctx, dispatch, config, navigateTo) => {

    const stateVO = config.types[ctx.focusedElement!.id];

    if(!stateVO) {
      return {
        cody: `I can't find the information ${ctx.focusedElement!.id} in the types registry.`,
        details: `That seems to be a bug in Cody Play. Please contact the prooph board team!`,
        type: CodyResponseType.Error
      }
    }

    const stateVoSchema = cloneDeepJSON(stateVO.schema);
    let stateVoUiSchema = cloneDeepJSON(stateVO.uiSchema);
    const stateLabel = playNodeLabel(stateVO.desc.name);

    const cmdName = `Edit ${stateLabel}`;
    const eventName = `${stateLabel} Edited`;

    const cmdSchema = {
      $ref: registryIdToDataReference(stateVO.desc.name),
    }

    const desc = stateVO.desc;

    const cmdUiSchema: UiSchema = {
      "ui:button": {
        "label": "save",
        "icon": "zip-disk"
      }
    };

    if(!isQueryableStateDescription(desc)) {
      return {
        cody: `I can't install the possibility to edit a ${stateLabel}. The information shown on the page has no configured identifier.`,
        type: CodyResponseType.Error,
        details: `Please switch to prooph board and design a command by hand.`
      }
    }

    cmdUiSchema[desc.identifier] = {
      "ui:widget": "hidden"
    };

    const editedCtx = getEditedContextFromConfig(config);

    // First add a new event and let the list VO projection handle the event
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

    const prjType = findProjectionType(stateVO, config);

    if(!prjType) {
      return {
        cody: `I can't add a projection case for handling edited events of state "${stateVO.desc.name}". I'm looking for a list type in the Cody Play type registry that has "${stateVO.desc.name}" defined as "itemType", but I can't find one.`,
        details: `Please check the Cody Play config in the App Settings dialog. If you can't solve the issue, please contact the prooph board team!`,
        type: CodyResponseType.Error
      }
    }


    const prjName = prjType.desc.projection || `${prjType.desc.name.split('.').pop()}Projection`;

    const pbInfo = playGetProophBoardInfoFromDescription(prjType.desc);

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
                information: prjType.desc.name,
                id: `$> event.${(prjType.desc as QueryableStateListDescription).itemIdentifier}`,
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

    const editAction: CommandAction = {
      type: 'command',
      command: `${names(config.defaultService).className}.${names(cmdName).className}`,
      data: `$> page|data('${registryIdToDataReference(stateVO.desc.name)}', {})`,
      button: {
        label: `Edit`,
        icon: 'pencil',
        color: 'default'
      },
      position: "top-right"
    }

    if(!stateVoUiSchema) {
      stateVoUiSchema = {}
    }

    if(!stateVoUiSchema['ui:options']) {
      stateVoUiSchema['ui:options'] = {}
    }

    if(!stateVoUiSchema['ui:options']['actions'] || !Array.isArray(stateVoUiSchema['ui:options']['actions'])) {
      stateVoUiSchema['ui:options']['actions'] = [];
    }

    (stateVoUiSchema['ui:options']['actions'] as Array<CommandAction>).push(editAction)

    // Update state VO
    dispatch({
      ctx: editedCtx,
      type: "ADD_TYPE",
      name: stateVO.desc.name,
      information: {
        ...stateVO,
        uiSchema: stateVoUiSchema
      },
      definition: {
        definitionId: playDefinitionIdFromFQCN(stateVO.desc.name),
        schema: stateVoSchema as JSONSchema7
      }
    });

    return {
      cody: `I've added an edit button (pencil icon) to the view.`
    }
  }
}
