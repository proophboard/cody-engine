import {ValidatorType} from "@rjsf/utils";
import {customizeValidator} from "@rjsf/validator-ajv8";

let validator: ValidatorType;

const ajvOptions = {ajvOptionsOverrides: {$data: true, useDefaults: true, strict: false}};

export const getRjsfValidator = (): ValidatorType => {
  if(!validator) {
    validator = customizeValidator(ajvOptions)
  }

  return validator;
}

export const resetRjsfValidator = (): void => {
  validator = customizeValidator(ajvOptions)
}
