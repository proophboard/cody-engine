import {
  isQueryableListDescription, isQueryableNotStoredStateListDescription,
  isQueryableStateListDescription,
  QueryableListDescription,
  QueryableStateListDescription
} from "@event-engine/descriptions/descriptions";
import {Rule} from "@app/shared/rule-engine/configuration";
import {getVOFromTypes} from "@frontend/app/components/core/form/widgets/data-select/get-vo-from-types";
import {JSONSchemaWithId} from "@frontend/app/components/core/form/widgets/json-schema/json-schema-with-id";

export interface ParsedUiOptions {
  data: QueryableStateListDescription | QueryableListDescription,
  label: string,
  value: string,
  addItemCommand: string | null,
  query: Record<string, string>,
  filter?: string,
  updateForm?: Rule[]
}

export const parseOptions = (options: any, rootSchema: JSONSchemaWithId): ParsedUiOptions => {
  if(!options.data || typeof options.data !== "string") {
    throw new Error('DataSelect: no "data" attribute configured!');
  }

  const vo = getVOFromTypes(options.data, rootSchema);

  if(!isQueryableStateListDescription(vo.desc) && !isQueryableListDescription(vo.desc) && !isQueryableNotStoredStateListDescription(vo.desc)) {
    throw new Error(`DataSelect: Type "${options.data}" is not a queryable list`);
  }

  if((!options.label || typeof options.label !== "string") && (!options.text || typeof options.text !== "string")) {
    throw new Error(`DataSelect: ui:options "label" is not a string`);
  }

  if(!options.value || typeof options.value !== "string") {
    throw new Error(`DataSelect: ui:options "value" is not a string`);
  }

  if(options.addItemCommand && typeof options.addItemCommand !== "string") {
    throw new Error(`DataSelect: ui:options "addItemCommand" is not a valid command name`)
  }

  if(options.updateForm && !Array.isArray(options.updateForm)) {
    throw new Error(`DataSelect: ui:options "updateForm" must be an array of rules`)
  }

  return {
    data: vo.desc,
    label: options.label || options.text,
    value: options.value,
    addItemCommand: options.addItemCommand || null,
    query: options.query || {},
    filter: options.filter,
    updateForm: options.updateForm,
  }
}
