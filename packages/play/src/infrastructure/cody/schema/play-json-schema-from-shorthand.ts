import {CodyResponse, CodyResponseType} from "@proophboard/cody-types";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {JSONSchema7} from "json-schema";
import {PlaySchemaDefinitions} from "@cody-play/state/types";

export const NAMESPACE = "namespace";

export interface ShorthandObject {[property: string]: ShorthandObject | string}

export const isRootNamespace = (ref: string): boolean => {
  return ref.length > 0 && ref.charAt(0) === "/";
}

export const convertShorthandObjectToJsonSchema = (shorthand: ShorthandObject, namespace?: string): JSONSchema7 | CodyResponse => {
  const schema: JSONSchema7 = {
    type: "object",
    properties: {},
    required: [],
    additionalProperties: false,
  };

  if(typeof shorthand !== 'object') {
    return {
      cody: `I was not able to convert shorthand object: "${JSON.stringify(shorthand)}" to JSONSchema`,
      type: CodyResponseType.Error
    }
  }

  if(!namespace) {
    namespace = "/";
  }

  if(namespace.charAt(namespace.length - 1) !== "/") {
    namespace += "/";
  }

  for (const property in shorthand) {
    // eslint-disable-next-line no-prototype-builtins
    if(!shorthand.hasOwnProperty(property)) { continue; }

    if(property === '') {
      return {
        cody: `Shorthand object ${JSON.stringify(shorthand)} contains an empty property string. Can't deal with that.`,
        details: "Please remove it!",
        type: CodyResponseType.Error
      }
    }

    let schemaProperty = property;

    if(property.slice(-1) === '?') {
      schemaProperty = property.slice(0, property.length - 1);
    } else if (property === "$ref") {
      if(Object.keys(shorthand).length > 1) {
        return {
          cody: `Shorthand ${JSON.stringify(shorthand)} contains a top level ref property "$ref", but it is not the only property!`,
          details: 'A top level reference cannot have other properties then "$ref".',
          type: CodyResponseType.Error
        }
      }

      const reference = (shorthand[schemaProperty] as string).replace('#/definitions', '');

      if(isRootNamespace(reference)) {
        return {
          "$ref": `#/definitions${reference}`
        };
      }

      return {
        "$ref": `#/definitions${namespace}${reference}`
      };
    } else if (property === '$items') {
      if(typeof shorthand[schemaProperty] !== 'string') {
        return {
          cody: `Detected a top level shorthand array using an "$items" prop, but the value of the property is not a string.`,
          details: "It is of type " + typeof shorthand[schemaProperty],
          type: CodyResponseType.Error
        }
      }

      if(Object.keys(shorthand).length > 1) {
        // Allow title as the only alternative property
        if(!Object.keys(shorthand).includes('$title')) {
          return {
            cody: `Shorthand ${JSON.stringify(shorthand)} contains a top level array property "$items", but it is not the only property!`,
            details: 'A top level array cannot have other properties then "$items".',
            type: CodyResponseType.Error
          }
        }
      }

      let itemsShorthandSchema = shorthand[schemaProperty] as string;

      if(itemsShorthandSchema.slice(-2) !== '[]') {
        itemsShorthandSchema = itemsShorthandSchema + '[]';
      }

      const arraySchema = convertShorthandStringToJsonSchema(itemsShorthandSchema, namespace);

      if(!playIsCodyError(arraySchema) && Object.keys(shorthand).includes('$title')) {
        arraySchema.title = shorthand['$title'] as string;
      }

      return arraySchema;
    } else if (schemaProperty === '$title') {
      schema.title = shorthand[property] as string;
      delete shorthand[property];
      continue;
    } else {
      if(schema.required && Array.isArray(schema.required)) {
        schema.required.push(property);
      }
    }

    if(typeof shorthand[property] === "object") {
      const propertySchemaObj = convertShorthandObjectToJsonSchema(shorthand[property] as ShorthandObject, namespace);

      if(playIsCodyError(propertySchemaObj)) {
        return propertySchemaObj;
      }

      schema.properties![schemaProperty] = propertySchemaObj;
    } else if(typeof shorthand[property] === "string") {
      const propertySchema = convertShorthandStringToJsonSchema(shorthand[property] as string, namespace);

      if(playIsCodyError(propertySchema)) {
        return propertySchema;
      }

      schema.properties![schemaProperty] = propertySchema;
    } else {
      return {
        cody: `I tried to parse JSONSchema for property: "${ property }", but it is neither a string nor an object.`,
        details: "Can you check that please?!",
        type: CodyResponseType.Error
      }
    }
  }

  return schema;
}

export const convertShorthandStringToJsonSchema = (shorthand: string, namespace: string): JSONSchema7 | CodyResponse => {
  if(shorthand === '') {
    return {type: "string"}
  }

  if(namespace === "") {
    namespace = "/";
  }

  if(namespace.charAt(namespace.length - 1) !== "/") {
    namespace += "/";
  }

  const parts = shorthand.split('|');

  if(parts[0].match(/^enum:/)) {
    const enumVals = parts[0].replace('enum:', '');
    return {
      enum: enumVals.split(',').map(val => val.trim()),
    }
  }

  if(parts[0].slice(-2) === '[]') {
    const itemsParts = [parts[0].replace('[]', '')];
    itemsParts.push(...parts.slice(1));

    const itemsSchema = convertShorthandStringToJsonSchema(itemsParts.join('|'), namespace);

    if(playIsCodyError(itemsSchema)) {
      return itemsSchema;
    }

    return {
      type: "array",
      items: itemsSchema
    }
  }

  switch (parts[0]) {
    case 'string':
    case 'integer':
    case 'number':
    case 'boolean':
      let type: string | string[] = parts[0];

      if(parts[1] && parts[1] === 'null') {
        type = [type as string, 'null'];
        parts.splice(1,1);
      }

      const schema: {[schemaProp: string]: string | boolean | number | string[] | {$data: string}} = {
        type,
      };

      if(parts.length > 1) {
        for (const part of parts.slice(1)) {
          const validation = parseShorthandValidation(part);

          if(playIsCodyError(validation)) {
            return validation;
          }

          schema[validation[0]] = validation[1];
        }
      }

      return schema;
    default:
      let ref = parts[0];
      const schemaProps: {[name: string]: any} = {};

      if(parts.length > 1) {
        const valParts = parts.filter((item, i) => i > 0);

        for (const valPart of valParts) {
          const validation = parseShorthandValidation(valPart);

          if (playIsCodyError(validation)) {
            return validation;
          }

          const [prop, val] = validation;

          schemaProps[prop] = val;
        }
      }

      // eslint-disable-next-line no-prototype-builtins
      if(!isRootNamespace(ref) && schemaProps.hasOwnProperty(NAMESPACE)) {
        ref = schemaProps[NAMESPACE] + '/' + ref;
      }

      // eslint-disable-next-line no-prototype-builtins
      if (schemaProps.hasOwnProperty(NAMESPACE)) {
        delete schemaProps[NAMESPACE];
      }

      if(isRootNamespace(ref)) {
        return {
          "$ref": `#/definitions${ref}`,
          ...schemaProps
        };
      }

      return {
        "$ref": `#/definitions${namespace}${ref}`,
        ...schemaProps
      }
  }
}

export const parseShorthandValidation = (validation: string): [string, string | number | boolean | {$data: string}] | CodyResponse => {
  const parts = validation.split(':');

  if(parts.length !== 2) {
    return {
      cody: `Can't parse shorthand validation: "${validation}". Expected format "validationKey:value". Please check again!`,
      type: CodyResponseType.Error
    }
  }

  const [validationKey, value] = parts;

  if(value === 'true') {
    return [validationKey, true];
  }

  if(value === 'false') {
    return [validationKey, false];
  }

  if(parseInt(value, 10).toString() === value) {
    return [validationKey, parseInt(value, 10)];
  }

  if(parseFloat(value).toString() === value) {
    return [validationKey, parseFloat(value)];
  }

  if(validationKey === "ns") {
    return [NAMESPACE, value];
  }

  if(validationKey[0] === "$") {
    return [validationKey.slice(1), {$data: '1/' + value.split(".").join("/")}]
  }

  return [validationKey, value];
}
const normalizeShorthandString = (shorthand: string): string => {
  shorthand = shorthand.replace('string|enum:', 'enum:');
  return shorthand;
}

const normalizeShorthandObject = (shorthand: ShorthandObject): ShorthandObject => {
  for (const shorthandKey in shorthand) {
    if(typeof shorthand[shorthandKey] === "string") {
      shorthand[shorthandKey] = normalizeShorthandString(shorthand[shorthandKey] as string);
    } else {
      shorthand[shorthandKey] = normalizeShorthandObject(shorthand[shorthandKey] as ShorthandObject);
    }
  }

  return shorthand;
}

export const playJsonSchemaFromShorthand = (shorthand: string | ShorthandObject, namespace: string): JSONSchema7 | CodyResponse => {
  if(typeof shorthand === "string") {
    return convertShorthandStringToJsonSchema(normalizeShorthandString(shorthand), namespace);
  }

  if(shorthand["$type"] && typeof shorthand["$type"] === "string") {
    const schema = convertShorthandStringToJsonSchema(normalizeShorthandString(shorthand["$type"]), namespace);

    if(playIsCodyError(schema)) {
      return schema;
    }

    if(shorthand["$title"] && typeof shorthand['$title'] === "string") {
      schema['title'] = shorthand['$title'];
    }

    return schema;
  }

  return convertShorthandObjectToJsonSchema(normalizeShorthandObject(shorthand), namespace);
}
