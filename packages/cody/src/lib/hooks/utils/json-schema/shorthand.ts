import {JSONSchema7TypeName} from "json-schema";
import {PRIMITIVE_SCHEMA_TYPES, SCHEMA_TYPES} from "./schema-types";

export interface ShorthandObject {
  [prop: string]: string | ShorthandObject;
}

export type Shorthand = string | ShorthandObject;

export const isShorthand = (schema: any): schema is Shorthand => {
  if(typeof schema === "string") {
    return isPrimitive(schema) || isRef(schema);
  }

  if(typeof schema === "object") {
    if(schema.type && SCHEMA_TYPES.includes(schema.type)) {
      return false;
    }

    return isObject(schema) || isList(schema) || isPrimitive(schema);
  }

  return false;
}

export const isObject = (schema: string | ShorthandObject): schema is ShorthandObject => {
  return typeof schema !== "string" && !isList(schema) && !isPrimitive(schema);
}

export const isList = (schema: Shorthand): boolean => {
  if(typeof schema === "string") {
    return false;
  }

  return typeof schema.$items !== "undefined";
}

export const isPrimitive = (schema: string | ShorthandObject): boolean => {
  let type = '';
  if(typeof schema === "string") {
    const parts = schema.split("|");

    type = parts[0];
  } else if(typeof schema.$type === 'string') {
    type = schema.$type;
  }


  return PRIMITIVE_SCHEMA_TYPES.includes(type as JSONSchema7TypeName);
}

export const isString = (schema: string | ShorthandObject, format?: string): boolean => {
  if(typeof schema === "object") {
    if(!schema.$type) {
      return false;
    }

    return isString(schema.$type);
  }

  const parts = schema.split("|");

  if(parts[0] !== "string") {
    return false;
  }

  if(!format) {
    return true;
  }

  // Normalize format
  format = format.replace('format:', '');
  format = 'format:'+format;

  for (const part of parts) {
    if(part === format) {
      return true;
    }
  }

  return false;
}

export const isRef = (schema: string | ShorthandObject): boolean => {
  if(typeof schema === "string") {
    return schema[0] === '/';
  }

  return typeof schema.$ref === "string";
}
