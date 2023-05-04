import {ajv} from "@event-engine/messaging/configuredAjv";
import {Event} from "@event-engine/messaging/event";
import {ValidationError} from "ajv";
import {addInstanceNameToError} from "@event-engine/messaging/add-instance-name-to-error";

const ajvValidate = ajv.compile({
  "$id": "GenericEvent",
  "type": "object",
  "properties": {
    "uuid": {
      "type": "string",
      "format": "uuid"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time",
    },
    "name": {
      "type": "string",
      "minLength": 1
    },
    "payload": {
      "type": "object"
    },
    "meta": {
      "type": "object"
    }
  },
  "required": ["uuid", "createdAt", "name", "payload", "meta"],
  "additionalProperties": false,
})

const validate = (event: any) => {
  if (!ajvValidate(event)) {
    const eventName = event['name'] || 'GenericEvent';
    if (ajvValidate.errors) {
      throw new ValidationError(ajvValidate.errors.map(e => addInstanceNameToError(e, eventName)));
    } else {
      throw new Error(`Validation for "${eventName}" failed for unknown reason.`);
    }
  }
}

export default validate;
