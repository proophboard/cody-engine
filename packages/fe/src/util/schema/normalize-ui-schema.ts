import {UiSchema} from "@rjsf/utils";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {Action, isCommandAction} from "@frontend/app/components/core/form/types/action";
import {normalizeCommandName} from "@cody-play/infrastructure/rule-engine/normalize-command-name";
import {RuntimeEnvironment} from "@frontend/app/providers/runtime-environment";

export const normalizeServerUiSchema = (uiSchema: UiSchema, defaultService: string): UiSchema => {
  const schema = cloneDeepJSON(uiSchema);

  if(typeof schema['ui:title'] === "boolean") {
    schema['ui:title'] = '';
  }

  if(schema.actions && Array.isArray(schema.actions)) {
    schema.actions.forEach((a: Action) => {
      normalizeAction(a, defaultService);
    })
  }

  for (const schemaKey in schema) {
    if(typeof schema[schemaKey] === "object") {
      schema[schemaKey] = normalizeServerUiSchema(schema[schemaKey], defaultService);
    }
  }

  return schema;
}

export const normalizeActions = (uiSchema: UiSchema, defaultService: string): UiSchema => {
  const schema = cloneDeepJSON(uiSchema);

  for (const schemaKey in schema) {
    if(schemaKey === "actions" && Array.isArray(schema[schemaKey])) {
      schema[schemaKey].forEach((a: Action) => {
        normalizeAction(a, defaultService);
      })
    }
  }

  for (const schemaKey in schema) {
    if(typeof schema[schemaKey] === "object") {
      schema[schemaKey] = normalizeActions(schema[schemaKey], defaultService);
    }
  }

  return schema;
}

export const normalizeAction = (a: Action, defaultService: string): Action => {
  if(isCommandAction(a)) {
    a.command = normalizeCommandName(a.command, defaultService);
  }

  if(!a.position) {
    a.position = "bottom-right";
  }

  return a;
}

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

    if(schemaKey === "actions" && Array.isArray(schema[schemaKey])) {
      schema[schemaKey].forEach((a: Action) => {
        normalizeAction(a, env.DEFAULT_SERVICE);
      })
    }
  }

  for (const schemaKey in schema) {
    if(typeof schema[schemaKey] === "object") {
      schema[schemaKey] = normalizeUiSchema(schema[schemaKey], ctx, env);
    }
  }

  return schema;
}
