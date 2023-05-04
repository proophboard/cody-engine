import {ErrorObject} from "ajv";

export const addInstanceNameToError = (e: ErrorObject, instance: string): ErrorObject => {
  e.instancePath = e.instancePath === ''? instance : `${instance}.${e.instancePath}`;
  return e;
}
