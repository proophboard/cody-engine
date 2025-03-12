import {UiSchema} from "@rjsf/utils";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {RuntimeEnvironment} from "@frontend/app/providers/UseEnvironment";

export const normalizeUiSchema = (uiSchema: UiSchema, ctx: any, env: RuntimeEnvironment): UiSchema => {
  const schema = cloneDeepJSON(uiSchema);

  if(env.UI_ENV === 'play' && schema.hasOwnProperty('play:widget')) {
    if(!schema['play:widget']) {
      delete schema['ui:widget'];
    } else {
      schema['ui:widget'] = schema['play:widget'];
    }
  }

  if(schema['ui:hidden']) {
    const expr = schema['ui:hidden'];
    delete schema['ui:hidden'];

    if(jexl.evalSync(expr, ctx)) {
      schema['ui:widget'] = 'hidden';
    }
  }

  for (const schemaKey in schema) {
    const parts = schemaKey.split(":");

    if(parts[parts.length - 1] === "expr") {
      parts.pop();
      const orgUISchemaKey = parts.join(":");

      schema[orgUISchemaKey] = jexl.evalSync(schema[schemaKey], ctx);
    }
  }

  for (const schemaKey in schema) {
    if(typeof schema[schemaKey] === "object") {
      schema[schemaKey] = normalizeUiSchema(schema[schemaKey], ctx, env);
    }
  }

  return schema;
}
