import {
  ExprPropModifier,
  PropModifier,
  SetPropModifier
} from "@cody-play/infrastructure/vibe-cody/utils/schema/property-modifiers";
import {PropMapping} from "@app/shared/rule-engine/configuration";
import {JSONSchema7} from "json-schema";
import {Schema} from "@cody-play/infrastructure/vibe-cody/utils/schema/schema";
import {get, set} from "lodash";

export const applyPropertyModifiers = (modifiers: PropModifier[], stateSchema: JSONSchema7, cmdSchema: JSONSchema7, evtSchema: JSONSchema7, eventMapping: PropMapping, prjSet: string): [JSONSchema7, JSONSchema7, PropMapping, string] => {

  modifiers.forEach(modifier => {

    const propIsOptional = modifier.prop.endsWith('?');

    const prop = modifier.prop.replace('?', '');

    const propertyJsonSchema = get(stateSchema, `properties.${prop}`) as unknown as JSONSchema7 | undefined;

    if(!propertyJsonSchema) {
      return;
    }

    const propertySchema = new Schema(propertyJsonSchema, true);

    switch (modifier.type) {
      case "input":
        set(cmdSchema, `properties.${prop}`, propertyJsonSchema);
        set(evtSchema, `properties.${prop}`, propertyJsonSchema);
        if(!propIsOptional) {
          (cmdSchema.required as string[]).push(prop);
          (evtSchema.required as string[]).push(prop);
        }
        eventMapping[prop] = `$> command.${prop}`;
        prjSet += `|set('${prop}', event.${prop})`;
        break;

      case "set":
        set(evtSchema, `properties.${prop}`, propertyJsonSchema);
        if(!propIsOptional) {
          (evtSchema.required as string[]).push(prop);
        }
        eventMapping[prop] = propertySchema.isString() ? `$> '${(modifier as SetPropModifier<string>).value}'` : `$> ${(modifier as SetPropModifier<any>).value}`;
        prjSet += `|set('${prop}', event.${prop})`;
        break;

      case "unset":
        prjSet += `|unset('${prop}')`;
        break;

      case "user":
        set(evtSchema, `properties.${prop}`, propertyJsonSchema);
        if(!propIsOptional) {
          (evtSchema.required as string[]).push(prop);
        }
        eventMapping[prop] = `$> meta.user.userId`;
        prjSet += `|set('${prop}', event.${prop})`;
        break;

      case "userEmail":
        set(evtSchema, `properties.${prop}`, propertyJsonSchema);
        if(!propIsOptional) {
          (evtSchema.required as string[]).push(prop);
        }
        eventMapping[prop] = `$> meta.user.email`;
        prjSet += `|set('${prop}', event.${prop})`;
        break;

      case "userName":
        set(evtSchema, `properties.${prop}`, propertyJsonSchema);
        if(!propIsOptional) {
          (evtSchema.required as string[]).push(prop);
        }
        eventMapping[prop] = `$> meta.user.displayName`;
        prjSet += `|set('${prop}', event.${prop})`;
        break;

      case "now":
        set(evtSchema, `properties.${prop}`, propertyJsonSchema);
        if(!propIsOptional) {
          (evtSchema.required as string[]).push(prop);
        }
        const isoConverter = propertySchema.isString('date')
          ? 'isoDate()'
          : propertySchema.isString('time')
            ? 'isoTime()'
            : 'isoDateTime()';

        eventMapping[prop] = `$> now()|${isoConverter}`;
        prjSet += `|set('${prop}', event.${prop})`;
        break;

      case "expr":
        set(evtSchema, `properties.${prop}`, propertyJsonSchema);
        if(!propIsOptional) {
          (evtSchema.required as string[]).push(prop);
        }

        eventMapping[prop] = (modifier as ExprPropModifier).expr;
        prjSet += `|set('${prop}', event.${prop})`;
        break;
    }
  })

  return [cmdSchema, evtSchema, eventMapping, prjSet];
}

