import {PRIMITIVE_SCHEMA_TYPES} from "../json-schema/is-json-schema";
import {JSONSchema7TypeName} from "json-schema";

export interface ShorthandObject {
  [prop: string]: string | ShorthandObject;
}

export type Shorthand = string | ShorthandObject;

export const isShorthand = (schema: any): schema is Shorthand => {
  if(typeof schema === "string") {
    return isPrimitive(schema) || isRef(schema);
  }

  if(typeof schema === "object") {
    return isObject(schema) || isList(schema) || isPrimitive(schema);
  }

  return false;
}

export const isObject = (schema: string | ShorthandObject): schema is ShorthandObject => {
  return typeof schema !== "string" && !isList(schema) && !isPrimitive(schema);
}

export const isList = (schema: Shorthand): boolean => {
  if(!schema) {
    return false;
  }

  if(typeof schema === "string") {
    return false;
  }

  return typeof schema.$items !== "undefined";
}

export const isPrimitive = (schema: string | ShorthandObject): boolean => {
  if(!schema) {
    return false;
  }

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

export const isPropertyRef = (ref: string): boolean => {
  return ref.indexOf(':') !== -1;
}

export const splitPropertyRef = (ref: string): [string, string] => {
  const split = ref.split(':');

  if(split.length === 1) {
    split.push('');
  }
  return split as [string, string];
}
