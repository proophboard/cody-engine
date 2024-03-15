import {names} from "@event-engine/messaging/helpers";
import {JSONSchema7} from "json-schema";
import {isPropertyRef, splitPropertyRef} from "@event-engine/messaging/resolve-refs";

export const playNormalizeRefs = (schema: JSONSchema7, service: string): JSONSchema7 => {
  return visitRef(schema, ref => {
    const isPropRef = isPropertyRef(ref);
    const [refWithoutProp, prop] = isPropRef ? splitPropertyRef(ref) : [ref, ''];

    const refParts = refWithoutProp.split("/");
    if(refParts.length === 0) {
      return ref;
    }

    if(refParts[0] === "#" || refParts[0] === "") {
      refParts.shift();
    }

    // index 0 should be "definitions" now and 1 the service, if not add service part
    if(refParts.length < 2) {
      return names(refParts[0]).fileName;
    }

    const serviceNames = names(service);

    if(refParts[1] !== serviceNames.fileName) {
      refParts.splice(1, 0, serviceNames.fileName);
    }



    return '/' + refParts.map(p => names(p).fileName).join('/') + (isPropRef? ':'+prop : '');
  })
}

const visitRef = (schema: JSONSchema7, visitor: (ref: string) => string): JSONSchema7 => {
  const internalSchema: any = schema;

  if(internalSchema['$id']) {
    internalSchema['$id'] = visitor(internalSchema['$id']);
  }

  if(internalSchema['$ref']) {
    internalSchema['$ref'] = visitor(internalSchema['$ref']);
  }

  if(internalSchema['properties']) {
    for (const prop in internalSchema['properties']) {
      internalSchema['properties'][prop] = visitRef(internalSchema['properties'][prop], visitor);
    }
  }

  if(internalSchema['items']) {
    internalSchema['items'] = visitRef(internalSchema['items'] as JSONSchema7, visitor);
  }

  return internalSchema as JSONSchema7;
}
