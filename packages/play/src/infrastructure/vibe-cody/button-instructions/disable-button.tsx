import {Instruction, InstructionProvider} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {setButtonProperty} from "@cody-play/infrastructure/vibe-cody/utils/set-button-property";
import {FocusedButton} from "@cody-play/state/focused-element";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {getLabelFromInstruction} from "@cody-play/infrastructure/vibe-cody/utils/text/get-label-from-instruction";
import { Cancel } from "mdi-material-ui";
import {PlayInformationRuntimeInfo} from "@cody-play/state/types";
import {playNodeLabel, playServiceFromFQCN} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import {registryIdToDataReference} from "@app/shared/utils/registry-id-to-data-reference";
import {getAllTypesOnPage} from "@cody-play/infrastructure/vibe-cody/utils/types/get-all-types-on-page";
import {isQueryableStateDescription, isStateDescription} from "@event-engine/descriptions/descriptions";
import {Schema} from "@cody-play/infrastructure/vibe-cody/utils/schema/schema";
import {JSONSchema7} from "json-schema";
import {get} from "lodash";

const makeDisableButtonViaExpr = (): Instruction => {
  const TEXT = `Disable the button via expression`

  return {
    text: `${TEXT} "$> "`,
    label: TEXT,
    icon: <Cancel />,
    cursorPosition: {start: 38},
    isActive: () => true,
    match: input => input.startsWith(TEXT),
    execute: async (input, ctx, dispatch, config) => {
      const expr = getLabelFromInstruction(input, TEXT);

      const success = await setButtonProperty(
        ctx.focusedElement! as FocusedButton,
        'disabled:expr',
        expr,
        config,
        dispatch
      )

      if (playIsCodyError(success)) {
        return success;
      }

      return {
        cody: `Button is now disabled when the expression returns true.`
      }
    }
  }
}

const makeDisableButtonWhenStatePropIsValue = (stateVO: PlayInformationRuntimeInfo, prop: string, val: unknown): Instruction => {
  const stateLabel = playNodeLabel(stateVO.desc.name);

  const TEXT = `Disable the button when ${stateLabel} ${prop} is "${val}"`;

  return {
    text: TEXT,
    icon: <Cancel />,
    noInputNeeded: true,
    isActive: () => true,
    match: input => input.startsWith(TEXT),
    execute: async (input, ctx, dispatch, config) => {
      const success = await setButtonProperty(
        ctx.focusedElement! as FocusedButton,
        'disabled:expr',
        `$> page|data('${registryIdToDataReference(stateVO.desc.name)}')|get('${prop}') == ${typeof val === 'string' ? `'${val}'` : val}`,
        config,
        dispatch
      )

      if (playIsCodyError(success)) {
        return success;
      }

      return {
        cody: `Button is now disabled when ${stateLabel} ${prop} is "${val}".`
      }
    }
  }
}

const makeDisableButtonWhenStatePropIsNotValue = (stateVO: PlayInformationRuntimeInfo, prop: string, val: unknown): Instruction => {
  const stateLabel = playNodeLabel(stateVO.desc.name);

  const TEXT = `Disable the button when ${stateLabel} ${prop} is not "${val}"`;

  return {
    text: TEXT,
    icon: <Cancel />,
    noInputNeeded: true,
    isActive: () => true,
    match: input => input.startsWith(TEXT),
    execute: async (input, ctx, dispatch, config) => {
      const success = await setButtonProperty(
        ctx.focusedElement! as FocusedButton,
        'disabled:expr',
        `$> page|data('${registryIdToDataReference(stateVO.desc.name)}')|get('${prop}') != ${typeof val === 'string' ? `'${val}'` : val}`,
        config,
        dispatch
      )

      if (playIsCodyError(success)) {
        return success;
      }

      return {
        cody: `Button is now disabled when ${stateLabel} ${prop} is not "${val}".`
      }
    }
  }
}

export const DisableButtonProvider: InstructionProvider = {
  isActive: (context, config) => !!context.focusedElement && context.focusedElement.type === "button",
  provide: (context, config) => {

    const pageConfig = context.page.handle.page;

    const types = getAllTypesOnPage(pageConfig, config);

    const instructions: Instruction[] = [
      makeDisableButtonViaExpr(),
    ];

    types.forEach(type => {
      if(isQueryableStateDescription(type.desc)) {
        let stateSchema = new Schema(type.schema as JSONSchema7, true);

        if(stateSchema.isRef()) {
          stateSchema.resolveRef(playServiceFromFQCN(type.desc.name), config.types);
        }

        const stateJSONSchema = stateSchema.toJsonSchema();

        const properties = get(stateJSONSchema, 'properties', {} as Record<string, any>);

        for (const prop in properties) {
          const propSchema: JSONSchema7 = properties[prop] as JSONSchema7;

          if(propSchema.type && propSchema.type === "boolean") {
            instructions.push(makeDisableButtonWhenStatePropIsValue(type, prop, true))
            instructions.push(makeDisableButtonWhenStatePropIsValue(type, prop, false))
          }

          if(propSchema.enum) {
            propSchema.enum.forEach(val => {
              instructions.push(makeDisableButtonWhenStatePropIsValue(type, prop, val));
              instructions.push(makeDisableButtonWhenStatePropIsNotValue(type, prop, val));
            })
          }
        }
      }
    })

    return instructions;
  }
}
