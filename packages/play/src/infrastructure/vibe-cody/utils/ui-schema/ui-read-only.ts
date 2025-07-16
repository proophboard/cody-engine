import {UiSchema} from "@rjsf/utils";

export const uiReadOnly = (uiSchema: UiSchema): UiSchema => {
  return {...uiSchema, 'ui:readonly': true};
}
