import {
  CodyInstructionResponse,
  Instruction,
  InstructionProvider
} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {CogPlayOutline, ShieldEditOutline} from "mdi-material-ui";
import {isStateViewFocused} from "@cody-play/infrastructure/vibe-cody/utils/types/is-state-view-focused";
import {getFocusedStateVO} from "@cody-play/infrastructure/vibe-cody/utils/types/get-focused-state-v-o";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import {getLabelFromInstruction} from "@cody-play/infrastructure/vibe-cody/utils/text/get-label-from-instruction";
import {CodyResponseType, NodeType} from "@proophboard/cody-types";
import {registryIdToDataReference} from "@app/shared/utils/registry-id-to-data-reference";
import {
  isQueryableStateDescription,
  isStateDescription, StateDescription,
} from "@event-engine/descriptions/descriptions";
import {CodyPlayConfig, getEditedContextFromConfig} from "@cody-play/state/config-store";
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
import {
  playDefinitionIdFromFQCN,
  playNodeLabel,
  playServiceFromFQCN
} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import {JSONSchema7} from "json-schema";
import {convertCommandNameToEvent} from "@cody-play/infrastructure/vibe-cody/utils/text/convert-command-name-to-event";
import {removeArticles} from "@cody-play/infrastructure/vibe-cody/utils/text/remove-articles";
import {PlayInformationRuntimeInfo} from "@cody-play/state/types";
import {Schema} from "@cody-play/infrastructure/vibe-cody/utils/schema/schema";
import {getCurrentLine} from "@cody-play/infrastructure/vibe-cody/utils/text/get-current-line";
import {VibeCodyContext} from "@cody-play/infrastructure/vibe-cody/VibeCodyContext";
import {PlayConfigDispatch} from "@cody-play/infrastructure/cody/cody-message-server";
import {parsePropModifiers} from "@cody-play/infrastructure/vibe-cody/utils/schema/property-modifiers";
import {startCase} from "lodash";
import {PropMapping} from "@app/shared/rule-engine/configuration";
import {
  applyPropertyModifiers,
  hasOnlyBackendModifiers
} from "@cody-play/infrastructure/vibe-cody/utils/schema/apply-property-modifiers";
import {
  getFocusedQueryableStateListVo
} from "@cody-play/infrastructure/vibe-cody/utils/types/get-focused-queryable-state-list-vo";
import {UiSchema} from "@rjsf/utils";

export const TEXT = `Add an action to `;

const execute = async (stateVO: PlayInformationRuntimeInfo, cmdName: string, eventName: string, input: string, ctx: VibeCodyContext, dispatch: PlayConfigDispatch, config: CodyPlayConfig, createsNewState?: boolean): Promise<CodyInstructionResponse> => {

  const pageConfig = ctx.page.handle.page;
  let stateVoJsonSchema = cloneDeepJSON(stateVO.schema) as JSONSchema7;
  let stateVoUiSchema: UiSchema = cloneDeepJSON(stateVO.uiSchema || {});
  const stateDesc = stateVO.desc;

  let stateVoObjectSchema = new Schema(stateVoJsonSchema, true);

  if(stateVoObjectSchema.isRef()) {
    stateVoObjectSchema = stateVoObjectSchema.resolveRef(playServiceFromFQCN(stateDesc.name), config.types);
    stateVoJsonSchema = stateVoObjectSchema.toJsonSchema();
  }

  const modifiers = parsePropModifiers(input);

  if(!isStateDescription(stateDesc) || !isQueryableStateDescription(stateDesc)) {
    return {
      cody: `I can't add an action for the information, because the information has no identifier defined.`,
      details: `This seems to be a bug, please contact the prooph board team.`
    }
  }

  let cmdSchema: JSONSchema7 = {
    type: "object",
    properties: {
      [stateDesc.identifier]: {
        type: "string",
        format: "uuid"
      }
    },
    required: [stateDesc.identifier],
    additionalProperties: false
  };

  let cmdUiSchema: UiSchema = {
    [stateDesc.identifier]: {'ui:widget': 'hidden'},
    "ui:button": {
      "label": "save",
      "icon": "zip-disk"
    }
  }

  let cmdFormDataInit: PropMapping = {
    [stateDesc.identifier]: createsNewState ? `$> uuid()` : `$> page|data('${registryIdToDataReference(stateVO.desc.name)}')|get('${stateDesc.identifier}')`
  };

  let eventSchema = cloneDeepJSON(cmdSchema);
  let eventMapping: PropMapping = {
    [stateDesc.identifier]: `$> command.${stateDesc.identifier}`
  };

  let prjSet = "$> doc";

  [cmdSchema, cmdUiSchema, eventSchema, eventMapping, prjSet, cmdFormDataInit] = applyPropertyModifiers(
    modifiers,
    stateVO.desc.name,
    stateVoJsonSchema,
    stateVoUiSchema,
    cmdSchema,
    cmdUiSchema,
    eventSchema,
    eventMapping,
    prjSet,
    cmdFormDataInit,
    createsNewState
  );

  const editedCtx = getEditedContextFromConfig(config);

  // First add a new event and let the list VO projection handle the event
  const eventMeta: EventMetaRaw = {
    schema: eventSchema,
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

  const prjType = createsNewState ? getFocusedQueryableStateListVo(ctx.focusedElement, pageConfig, config) :  findProjectionType(stateVO, config);

  if(!prjType || playIsCodyError(prjType)) {
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
        createsNewState
          ? {
            rule: "always",
            then: {
              upsert: {
                information: prjType.desc.name,
                id: `$> event.${stateDesc.identifier}`,
                set: `$> event`
              }
            }
          }
          : {
            rule: "always",
            then: {
              replace: {
                information: prjType.desc.name,
                loadDocIntoVariable: "doc",
                filter: {
                  docId: `$> event.${stateDesc.identifier}`
                },
                set: prjSet
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
            mapping: eventMapping,
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
    data: cmdFormDataInit,
    directSubmit: hasOnlyBackendModifiers(modifiers),
    button: {
      label: cmdName,
      icon: createsNewState ? 'plus' : 'pencil',
      color: 'default'
    },
    position: "top-right"
  }

  let uiSchemaToAddAction: UiSchema | undefined = createsNewState ? cloneDeepJSON(prjType.uiSchema || {}) : stateVoUiSchema;

  if(!uiSchemaToAddAction) {
    uiSchemaToAddAction = {}
  }

  if(!uiSchemaToAddAction['ui:options']) {
    uiSchemaToAddAction['ui:options'] = {}
  }

  if(!uiSchemaToAddAction['ui:options']['actions'] || !Array.isArray(uiSchemaToAddAction['ui:options']['actions'])) {
    uiSchemaToAddAction['ui:options']['actions'] = [];
  }

  (uiSchemaToAddAction['ui:options']['actions'] as Array<CommandAction>).push(editAction)

  if(createsNewState) {
    // Update List VO
    dispatch({
      ctx: editedCtx,
      type: "ADD_TYPE",
      name: prjType.desc.name,
      information: {
        ...prjType,
        uiSchema: uiSchemaToAddAction
      },
      definition: {
        definitionId: playDefinitionIdFromFQCN(prjType.desc.name),
        schema: prjType.schema as JSONSchema7
      }
    });
  } else {
    // Update state VO
    dispatch({
      ctx: editedCtx,
      type: "ADD_TYPE",
      name: stateVO.desc.name,
      information: {
        ...stateVO,
        uiSchema: uiSchemaToAddAction
      },
      definition: {
        definitionId: playDefinitionIdFromFQCN(stateVO.desc.name),
        schema: stateVoJsonSchema as JSONSchema7
      }
    });
  }

  return {
    cody: `I've added a button to "${cmdName}".`,
    details: `This will record an event named "${eventName}".`
  }
}

export const AddStateAction: Instruction & {
  execute: (input: string, ctx: VibeCodyContext, dispatch: PlayConfigDispatch, config: CodyPlayConfig, navigateTo: (route: string) => void, injectedStateVO?: PlayInformationRuntimeInfo, createsNewState?: boolean) => Promise<CodyInstructionResponse>
} = {
  text: TEXT,
  icon: <CogPlayOutline />,
  notUndoable: true,
  isActive: (context, config) => isStateViewFocused(context.focusedElement, context.page.handle.page, config),
  match: input => input.startsWith(TEXT),
  execute: async (input, ctx, dispatch, config, navigateTo, injectedStateVO?: PlayInformationRuntimeInfo, createsNewState?: boolean) => {
    const stateVO = injectedStateVO || getFocusedStateVO(ctx.focusedElement, ctx.page.handle.page, config);

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
    let eventName = convertCommandNameToEvent(rawCmdLabel);

    if(playIsCodyError(eventName)) {
      return eventName;
    }

    eventName = startCase(eventName);

    // Now remove articles to shorten the command name
    const cmdName = startCase(removeArticles(rawCmdLabel));

    return {
      cody: `I'm going to add a command called "${cmdName}" that records an event "${eventName}".\n\nThe information "${playNodeLabel(stateDesc.name)}" is ${createsNewState ? 'created' : 'changed'} according to the data in the event.`,
      details: [
        `To specify how the data is entered, write a list in the format:\n`,
        `- requiredProperty: modifyFunction()`,
        `- optionalProperty?: modifyFunction()\n`,
        `Modify functions are:\n`,
        `- input() -> Enter data via input`,
        `- set(value) -> Set a fixed value`,
        `- unset() -> unset the value`,
        `- user() -> Set user id`,
        `- userName() -> set user display name`,
        `- userEmail() -> set user email`,
        `- now() -> set current date/time`,
        `- expr($> ) use an expression`
      ].join(`\n`),
      type: CodyResponseType.Question,
      answers: [makeStateModifySuggestions(stateVO, cmdName, eventName, createsNewState)]
    }
  }
}

const makeStateModifySuggestions = (stateVO: PlayInformationRuntimeInfo, commandName: string, eventName: string, createsNewState?: boolean): InstructionProvider => {
  return {
    isActive: context => true,
    provide: (context, config) => {
      const stateVoJsonSchema = cloneDeepJSON(stateVO.schema);
      const stateDesc = stateVO.desc;

      let stateVoObjectSchema = new Schema(stateVoJsonSchema as JSONSchema7, true);

      if(stateVoObjectSchema.isRef()) {
        stateVoObjectSchema = stateVoObjectSchema.resolveRef(playServiceFromFQCN(stateDesc.name), config.types);
      }

      const properties = stateVoObjectSchema.getObjectProperties();

      const suggestions: Instruction[] = [];

      let lineOfCursor = 0;
      const cursorPos = context.cursorPosition;
      const text = context.searchStr;

      if(cursorPos.start) {
        const linesUntilCursor = text.substring(0, cursorPos.start).split("\n");
        lineOfCursor = linesUntilCursor.length - 1;
      }

      const lines = text.split("\n");
      const currentLine = lines[lineOfCursor];

      if(currentLine === '') {
        return [];
      }

      properties.forEach(prop => {
        if(isPropertyModified(prop, lines, currentLine)) {
          return;
        }

        if(prop === (stateDesc as StateDescription).identifier) {
          return;
        }

        if(!currentLine.includes(":")) {
          lines[lineOfCursor] = `- ${prop}${stateVoObjectSchema.isRequired(prop) ? '' : '?' }: `;
          suggestions.push(makeModifySuggestion(`${prop}`, lines.join(`\n`), stateVO, commandName, eventName, config, createsNewState));
          return;
        }

        const [propBulletPoint, ] = currentLine.split(":").map(p => p.trim());

        // Only suggest modifiers for the prop selected in current line
        if(!propBulletPoint.startsWith(`- ${prop}`)) {
          return;
        }

        const propSchema = stateVoObjectSchema.getObjectPropertySchema(prop, new Schema({}));
        const propJsonSchema = propSchema.toJsonSchema();

        // Input modifier
        const INPUT = `${propBulletPoint}: input()`;

        if(currentLine !== INPUT) {
          lines[lineOfCursor] = INPUT;

          suggestions.push(makeModifySuggestion(`input()`, lines.join(`\n`), stateVO, commandName, eventName, config, createsNewState))
        }

        // Set modifier
        if(propSchema.isString()) {
          if(propJsonSchema.enum && Array.isArray(propJsonSchema.enum)) {
            propJsonSchema.enum.forEach(enumOption => {
              const ENUM_OPTION_INPUT = `${propBulletPoint}: set(${enumOption})`;

              if(currentLine !== ENUM_OPTION_INPUT) {
                lines[lineOfCursor] = ENUM_OPTION_INPUT;

                suggestions.push(makeModifySuggestion(`set(${enumOption})`, lines.join(`\n`), stateVO, commandName, eventName, config, createsNewState))
              }
            })
          } else if (propSchema.isString('uuid')) {
            const USER_ID_INPUT = `${propBulletPoint}: user()`;

            if(currentLine !== USER_ID_INPUT) {
              lines[lineOfCursor] = USER_ID_INPUT;

              suggestions.push(makeModifySuggestion(`user()`, lines.join(`\n`), stateVO, commandName, eventName, config, createsNewState))
            }
          } else if (propSchema.isString('email')) {
            const USER_EMAIL_INPUT = `${propBulletPoint}: userEmail()`;

            if(currentLine !== USER_EMAIL_INPUT) {
              lines[lineOfCursor] = USER_EMAIL_INPUT;

              suggestions.push(makeModifySuggestion(`userEmail()`, lines.join(`\n`), stateVO, commandName, eventName, config, createsNewState))
            }
          } else if (propSchema.isString('date') || propSchema.isString('datetime') || propSchema.isString('time')) {
            const NOW_INPUT = `${propBulletPoint}: now()`;

            if(currentLine !== NOW_INPUT) {
              lines[lineOfCursor] = NOW_INPUT;

              suggestions.push(makeModifySuggestion(`now()`, lines.join(`\n`), stateVO, commandName, eventName, config, createsNewState))
            }
          } else {
            const USER_NAME_INPUT = `${propBulletPoint}: userName()`;

            if(currentLine !== USER_NAME_INPUT) {
              lines[lineOfCursor] = USER_NAME_INPUT;

              suggestions.push(makeModifySuggestion(`userName()`, lines.join(`\n`), stateVO, commandName, eventName, config, createsNewState))
            }
          }
        } else if (propJsonSchema.type === "boolean") {
          const TRUE_INPUT = `${propBulletPoint}: set(true)`;
          const FALSE_INPUT = `${propBulletPoint}: set(false)`;

          if(currentLine !== TRUE_INPUT) {
            lines[lineOfCursor] = TRUE_INPUT;

            suggestions.push(makeModifySuggestion(`set(true)`, lines.join(`\n`), stateVO, commandName, eventName, config, createsNewState))
          }

          if(currentLine !== FALSE_INPUT) {
            lines[lineOfCursor] = FALSE_INPUT;

            suggestions.push(makeModifySuggestion(`set(false)`, lines.join(`\n`), stateVO, commandName, eventName, config, createsNewState))
          }
        } else {
          const SET_INPUT = `${propBulletPoint}: set()`;

          if(!currentLine.startsWith(`${propBulletPoint}: set(`)) {
            lines[lineOfCursor] = SET_INPUT;

            suggestions.push(makeModifySuggestion(`set()`, lines.join(`\n`), stateVO, commandName, eventName, config, createsNewState))
          }
        }

        // Unset Modifier
        if(!stateVoObjectSchema.isRequired(prop)) {
          const UNSET_MODIFIER = `${propBulletPoint}: unset()`;

          if(currentLine !== UNSET_MODIFIER) {
            lines[lineOfCursor] = UNSET_MODIFIER;

            suggestions.push(makeModifySuggestion(`unset()`, lines.join(`\n`), stateVO, commandName, eventName, config, createsNewState))
          }
        }

        // Expr Modifier
        const EXPR_MODIFIER = `${propBulletPoint}: expr($> )`;

        if(!currentLine.startsWith(`${propBulletPoint}: expr($> `) ) {
          lines[lineOfCursor] = EXPR_MODIFIER;

          suggestions.push(makeModifySuggestion(`expr($> )`, lines.join(`\n`), stateVO, commandName, eventName, config, createsNewState))
        }
      })

      return suggestions;
    }
  }
}

const makeModifySuggestion = (label: string, text: string, stateVO: PlayInformationRuntimeInfo, commandName: string, eventName: string, config: CodyPlayConfig, createsNewState?: boolean): Instruction => {
  return {
    text,
    label,
    isActive: context => true,
    allowSubSuggestions: true,
    noInputNeeded: false,
    keepAnswers: true,
    match: (input, cursorPosition) => getCurrentLine(input, cursorPosition).startsWith(label),
    execute: async (input, ctx, dispatch, config1, navigateTo) => {
      return await execute(stateVO, commandName, eventName, input, ctx, dispatch, config1, createsNewState);
    }
  }
}

const isPropertyModified = (prop: string, lines: string[], currentLine: string): boolean => {
  return lines
    .filter(l => l !== currentLine)
    .map(l => l.trim())
    .filter(l => l.startsWith(`- ${prop}: `) || l.startsWith(`- ${prop}?: `)).length > 0;
}
