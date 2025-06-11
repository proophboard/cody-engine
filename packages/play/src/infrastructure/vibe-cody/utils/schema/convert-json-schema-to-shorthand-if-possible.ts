import {JSONSchema7} from "json-schema";
import {Shorthand, ShorthandObject} from "@cody-play/infrastructure/vibe-cody/utils/schema/shorthand";
import {isJsonSchemaPrimitive} from "@cody-play/infrastructure/vibe-cody/utils/json-schema/is-json-schema-primitive";
import {playFQCNFromDefinitionId} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import {registryIdToDataReference} from "@app/shared/utils/registry-id-to-data-reference";
import {isJsonSchemaArray} from "@cody-play/infrastructure/vibe-cody/utils/json-schema/is-json-schema-array";
import {isJsonSchemaObject} from "@cody-play/infrastructure/vibe-cody/utils/json-schema/is-json-schema-object";
import {isJsonSchemaRef} from "@cody-play/infrastructure/vibe-cody/utils/json-schema/is-json-schema-ref";

export const convertJsonSchemaToShorthandIfPossible = (jsonSchema: JSONSchema7): Shorthand | JSONSchema7 => {
  const converted = tryToConvert(jsonSchema);

  if(!converted) {
    return jsonSchema;
  }

  return converted;
}

const tryToConvert = (jsonSchema: JSONSchema7): Shorthand | false => {
  if(isJsonSchemaObject(jsonSchema)) {
    return convertObjToShorthand(jsonSchema);
  }

  if(isJsonSchemaArray(jsonSchema)) {
    return convertArrayToShorthand(jsonSchema);
  }

  if(isJsonSchemaRef(jsonSchema)) {
    return convertRefToShorthand(jsonSchema);
  }

  if(isJsonSchemaPrimitive(jsonSchema)) {
    return convertScalarToShorthand(jsonSchema);
  }

  return false;
}

const convertObjToShorthand = (jsonSchema: JSONSchema7): ShorthandObject | false => {
  const required = jsonSchema.required || [];

  if(!jsonSchema.properties) {
    return false;
  }

  const shorthand: ShorthandObject = {};

  // tslint:disable-next-line:forin
  for (let propName in jsonSchema.properties) {
    const shorthandProp = tryToConvert(jsonSchema.properties[propName] as JSONSchema7);

    if(false === shorthandProp) {
      return false;
    }

    if(!required.includes(propName)) {
      propName += '?';
    }

    shorthand[propName] = shorthandProp;
  }

  if(jsonSchema.title) {
    shorthand.$title = jsonSchema.title;
  }

  if(jsonSchema.default) {
    shorthand.$default = jsonSchema.default as any;
  }

  return shorthand;
}

const convertScalarToShorthand = (jsonSchema: JSONSchema7): Shorthand | false => {
  const copy: any = {...jsonSchema};

  if(!isJsonSchemaPrimitive(jsonSchema)) {
    return false;
  }

  const type = copy.type;

  delete copy.type;

  if(copy.enum) {
    return `enum:${copy.enum.join(",")}`
  }

  const options = Object.keys(copy);

  let shorthandStr = type;

  options.forEach(opt => {
    shorthandStr += `|${opt}:${copy[opt]}`
  })

  return shorthandStr;
}

const convertRefToShorthand = (jsonSchema: JSONSchema7): ShorthandObject | false => {
  if(!jsonSchema.$ref) {
    return false;
  }

  // Property ref
  if(jsonSchema.$ref.includes(":")) {
    return convertPropertyRefToShorthand(jsonSchema);
  }

  const fqcn = playFQCNFromDefinitionId(jsonSchema.$ref);

  return {
    $ref: registryIdToDataReference(fqcn)
  }
}

const convertPropertyRefToShorthand = (jsonSchema: JSONSchema7): ShorthandObject | false => {
  if(!jsonSchema.$ref) {
    return false;
  }

  // Property ref
  if(!jsonSchema.$ref.includes(":")) {
    return false;
  }

  const [ref, prop] = jsonSchema.$ref.split(":");

  const fqcn = playFQCNFromDefinitionId(ref);

  return {
    $ref: registryIdToDataReference(fqcn) + `:${prop}`
  }
}

const convertArrayToShorthand = (jsonSchema: JSONSchema7): ShorthandObject | false => {
  if(!isJsonSchemaArray(jsonSchema)) {
    return false;
  }

  const items = tryToConvert(jsonSchema.items as JSONSchema7);

  if(!items) {
    return false;
  }

  let shorthandObj: ShorthandObject = {};

  if(typeof items === "object" && items.$ref) {
    shorthandObj = {
      $items: items.$ref,
    }
  } else {
    shorthandObj = {
      $items: items
    }
  }

  if(jsonSchema.title) {
    shorthandObj.$title = jsonSchema.title;
  }

  if(jsonSchema.default) {
    shorthandObj.$default = jsonSchema.default as any;
  }

  return shorthandObj;
}
