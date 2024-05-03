import {Field} from "@rjsf/utils";
import {customFields} from "@frontend/extensions/app/form/fields";

export type FieldRegistry = {[fieldName: string]: Field};

export const fields: FieldRegistry = {
  ...customFields
}
