import {UiSchema} from "@rjsf/utils";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import jexl from "@app/shared/jexl/get-configured-jexl";

export const normalizeUiSchema = (uiSchema: UiSchema, ctx: any): UiSchema => {
  const schema = cloneDeepJSON(uiSchema);

  if(schema['ui:hidden']) {
    const expr = schema['ui:hidden'];
    delete schema['ui:hidden'];

    if(jexl.evalSync(expr, ctx)) {
      schema['ui:widget'] = 'hidden';
    }
  }

  for (const schemaKey in schema) {
    if(schemaKey.search('ui:') === -1) {
      schema[schemaKey] = normalizeUiSchema(schema[schemaKey], ctx);
    }
  }

  return schema;
}
