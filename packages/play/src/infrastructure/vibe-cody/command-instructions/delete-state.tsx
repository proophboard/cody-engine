import {Instruction} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {TrashCanOutline} from "mdi-material-ui";
import {isStateViewFocused} from "@cody-play/infrastructure/vibe-cody/utils/types/is-state-view-focused";
import {CodyResponseType, NodeType} from "@proophboard/cody-types";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import {playDefinitionIdFromFQCN, playNodeLabel} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import {registryIdToDataReference} from "@app/shared/utils/registry-id-to-data-reference";
import {UiSchema} from "@rjsf/utils";
import {isQueryableStateDescription, QueryableStateListDescription} from "@event-engine/descriptions/descriptions";
import {getEditedContextFromConfig} from "@cody-play/state/config-store";
import {EventMetaRaw} from "@cody-play/infrastructure/cody/event/play-event-metadata";
import {
  playMakeNodeRecordWithDefaults
} from "@cody-play/infrastructure/cody/node-traversing/play-make-node-record-with-defaults";
import {onNode} from "@cody-play/infrastructure/cody/hooks/on-node";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {findProjectionType} from "@cody-play/infrastructure/vibe-cody/utils/types/find-projection-type";
import {
  playGetProophBoardInfoFromDescription
} from "@cody-play/infrastructure/cody/pb-info/play-update-prooph-board-info";
import {names} from "@event-engine/messaging/helpers";
import {now} from "@cody-engine/cody/hooks/utils/time";
import {RawCommandMeta} from "@cody-play/infrastructure/cody/command/play-command-metadata";
import {convertNodeToJs} from "@cody-play/infrastructure/cody/node-traversing/convert-node-to-js";
import {CommandAction} from "@frontend/app/components/core/form/types/action";
import {JSONSchema7} from "json-schema";
import {isSubLevelPage, PageDefinition} from "@frontend/app/pages/page-definitions";
import {playIsTopLevelPage} from "@cody-play/infrastructure/cody/ui/play-is-top-level-page";
import {
  getRedirectAfterDeletePage
} from "@cody-play/infrastructure/vibe-cody/utils/navigate/get-redirect-after-delete-page";
import {getFocusedStateVO} from "@cody-play/infrastructure/vibe-cody/utils/types/get-focused-state-v-o";

const TEXT = `Place a delete button above the view.`;

export const DeleteState: Instruction = {
  text: TEXT,
  icon: <TrashCanOutline />,
  noInputNeeded: true,
  isActive: (context, config) => isStateViewFocused(context.focusedElement, context.page.handle.page, config),
  match: input => input.startsWith(TEXT),
  execute: async (input, ctx, dispatch, config, navigateTo) => {
    const page = ctx.page.handle.page;

    const stateVO = getFocusedStateVO(ctx.focusedElement, ctx.page.handle.page, config);

    if(playIsCodyError(stateVO)) {
      return stateVO;
    }

    const stateVoSchema = cloneDeepJSON(stateVO.schema);
    let stateVoUiSchema = cloneDeepJSON(stateVO.uiSchema);
    const stateLabel = playNodeLabel(stateVO.desc.name);

    const cmdName = `Delete ${stateLabel}`;
    const eventName = `${stateLabel} Deleted`;

    const desc = stateVO.desc;

    if(!isQueryableStateDescription(desc)) {
      return {
        cody: `I can't install the possibility to delete a ${stateLabel}. The information shown on the page has no configured identifier.`,
        type: CodyResponseType.Error,
        details: `Please switch to prooph board and design a command by hand.`
      }
    }

    const cmdSchema: any = {};

    cmdSchema[desc.identifier] = 'string|format:uuid'

    const cmdUiSchema: UiSchema = {
      "ui:description": `Do you really want to delete the ${playNodeLabel(stateVO.desc.name)}?`,
      "ui:button": {
        "label": "Yes",
        "icon": "trash-can-outline",
        "color": "error"
      },
      "ui:form": {
        "successRedirect": getRedirectAfterDeletePage(page, config).name
      }
    };

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
        cody: `I can't add a projection case for handling deleted events of state "${stateVO.desc.name}". I'm looking for a list type in the Cody Play type registry that has "${stateVO.desc.name}" defined as "itemType", but I can't find one.`,
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
              delete: {
                information: prjType.desc.name,
                filter: {
                  docId: `$> event.${desc.identifier}`
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

    const deleteAction: CommandAction = {
      type: 'command',
      command: `${names(config.defaultService).className}.${names(cmdName).className}`,
      data: `$> page|data('${registryIdToDataReference(stateVO.desc.name)}', {})|pick('${desc.identifier}')`,
      button: {
        label: `Delete`,
        icon: 'trash-can-outline',
        color: 'error'
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

    (stateVoUiSchema['ui:options']['actions'] as Array<CommandAction>).push(deleteAction);

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
      cody: `I've added a delete button to the view.`
    }
  }
}
