import { Instruction } from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {ShieldEditOutline} from "mdi-material-ui";
import {isStateViewFocused} from "@cody-play/infrastructure/vibe-cody/utils/types/is-state-view-focused";
import {getFocusedStateVO} from "@cody-play/infrastructure/vibe-cody/utils/types/get-focused-state-v-o";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import {getLabelFromInstruction} from "@cody-play/infrastructure/vibe-cody/utils/text/get-label-from-instruction";
import {CodyResponseType, NodeType} from "@proophboard/cody-types";
import {registryIdToDataReference} from "@app/shared/utils/registry-id-to-data-reference";
import {
  isQueryableStateDescription,
  isStateDescription,
} from "@event-engine/descriptions/descriptions";
import {getEditedContextFromConfig} from "@cody-play/state/config-store";
import {EventMetaRaw} from "@cody-play/infrastructure/cody/event/play-event-metadata";
import {
  playMakeNodeRecordWithDefaults
} from "@cody-play/infrastructure/cody/node-traversing/play-make-node-record-with-defaults";
import {onNode} from "@cody-play/infrastructure/cody/hooks/on-node";
import {findProjectionType} from "@cody-play/infrastructure/vibe-cody/utils/types/find-projection-type";
import {
  playGetProophBoardInfoFromDescription
} from "@cody-play/infrastructure/cody/pb-info/play-update-prooph-board-info";
import {names} from "@event-engine/messaging/helpers";
import {now} from "@cody-engine/cody/hooks/utils/time";
import {RawCommandMeta} from "@cody-play/infrastructure/cody/command/play-command-metadata";
import {convertNodeToJs} from "@cody-play/infrastructure/cody/node-traversing/convert-node-to-js";
import {CommandAction} from "@frontend/app/components/core/form/types/action";
import {playDefinitionIdFromFQCN, playNodeLabel} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import {JSONSchema7} from "json-schema";
import {convertCommandNameToEvent} from "@cody-play/infrastructure/vibe-cody/utils/text/convert-command-name-to-event";
import {removeArticles} from "@cody-play/infrastructure/vibe-cody/utils/text/remove-articles";

const TEXT = `Add an action to `;

export const AddStateAction: Instruction = {
  text: TEXT,
  icon: <ShieldEditOutline />,
  isActive: (context, config) => isStateViewFocused(context.focusedElement, context.page.handle.page, config),
  match: input => input.startsWith(TEXT),
  execute: async (input, ctx, dispatch, config) => {
    const stateVO = getFocusedStateVO(ctx.focusedElement, ctx.page.handle.page, config);

    if(playIsCodyError(stateVO)) {
      return stateVO;
    }

    const stateVoSchema = cloneDeepJSON(stateVO.schema);
    let stateVoUiSchema = cloneDeepJSON(stateVO.uiSchema);
    const stateDesc = stateVO.desc;

    if(!isStateDescription(stateDesc) || !isQueryableStateDescription(stateDesc)) {
      return {
        cody: `I can't add an action for the information, because the information has no identifier defined.`,
        details: `This seems to be a bug, please contact the prooph board team.`
      }
    }

    const rawCmdLabel = getLabelFromInstruction(input, TEXT);

    // Use the raw sentence to generate the event name as this helps to identify verbs and nouns
    const eventName = convertCommandNameToEvent(rawCmdLabel);
    // Now remove articles to shorten the command name
    const cmdName = removeArticles(rawCmdLabel);

    if(playIsCodyError(eventName)) {
      return eventName;
    }

    const cmdSchema = {
      [stateDesc.identifier]: 'string|format:uuid'
    };

    const cmdUiSchema = {
      [stateDesc.identifier]: {'ui:widget': 'hidden'},
      "ui:button": {
        "label": "save",
        "icon": "zip-disk"
      }
    }

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
        cody: `I can't add a projection case for handling events of state "${stateVO.desc.name}". I'm looking for a list type in the Cody Play type registry that has "${stateVO.desc.name}" defined as "itemType", but I can't find one.`,
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
              update: {
                information: prjType.desc.name,
                filter: {
                  docId: `$> event.${stateDesc.identifier}`
                },
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
      data: {
        [stateDesc.identifier]: `$> page|data('${registryIdToDataReference(stateVO.desc.name)}')|get('${stateDesc.identifier}')`
      },
      button: {
        label: cmdName,
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
      cody: `I've added a button to "${cmdName}".`,
      details: `This will record an event named "${eventName}". For now, no data is modified. You can change that by clicking on the button. This will open the command dialog and then you can tell me which input fields you want to have on the command form. I'll make sure that the data entered in the fields is passed to the event and also updates the information "${playNodeLabel(stateDesc.name)}".`
    }
  }
}
