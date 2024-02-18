import {ValidatorType} from "@rjsf/utils";
import {customizeValidator} from "@rjsf/validator-ajv8";

let validator: ValidatorType;

export const getRjsfValidator = (): ValidatorType => {
  if(!validator) {
    validator = customizeValidator({ajvOptionsOverrides: {$data: true, useDefaults: true, strict: false}})
  }

  return validator;
}
