import {JSONSchema7} from "json-schema-to-ts";

export type JSONSchemaWithId = JSONSchema7 & {$id: string};
