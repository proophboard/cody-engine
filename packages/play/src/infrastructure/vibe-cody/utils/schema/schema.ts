import {JSONSchema7} from "json-schema";
import {isEqual} from "lodash";
import {isJsonSchema} from "../json-schema/is-json-schema";
import {isJsonSchemaArray} from "../json-schema/is-json-schema-array";
import {isJsonSchemaObject} from "../json-schema/is-json-schema-object";
import {isJsonSchemaPrimitive} from "../json-schema/is-json-schema-primitive";
import {isJsonSchemaRef} from "../json-schema/is-json-schema-ref";
import {isJsonSchemaString} from "../json-schema/is-json-schema-string";
import {
  isList,
  isObject,
  isPrimitive,
  isRef,
  isShorthand,
  isString,
  Shorthand,
  ShorthandObject,
  splitPropertyRef
} from "./shorthand";
import {PlayInformationRegistry, PlayInformationRuntimeInfo} from "@cody-play/state/types";
import {playGetVoRuntimeInfoFromDataReference} from "@cody-play/state/play-get-vo-runtime-info-from-data-reference";
import {playFQCNFromDefinitionId, playServiceFromFQCN} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import {playwithErrorCheck} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {playJsonSchemaFromShorthand} from "@cody-play/infrastructure/cody/schema/play-json-schema-from-shorthand";
import {playNormalizeRefs} from "@cody-play/infrastructure/cody/schema/play-normalize-refs";
import {namespaceToJSONPointer, prepareNs} from "@cody-engine/cody/hooks/utils/value-object/namespace";
import {
  convertJsonSchemaToShorthandIfPossible
} from "@cody-play/infrastructure/vibe-cody/utils/schema/convert-json-schema-to-shorthand-if-possible";


export class Schema {

  public static fromString(schemaStr: string): Schema {
    if (isShorthand(schemaStr)) {
      return new Schema(schemaStr);
    }

    try {
      const parsedSchema = JSON.parse(schemaStr);
      return new Schema(parsedSchema);
    } catch (e) {
      console.warn("[CodyWizard] Schema.fromString was not able to parse JSON string", schemaStr, e);
      return new Schema({});

    }
  }

  private shorthand: Shorthand | null = null;
  private jsonSchema: JSONSchema7 | null = null;

  constructor(schema: Shorthand | JSONSchema7 | Schema, isJSONSchema?: boolean) {
    if(schema instanceof Schema) {
      schema = schema.toJSON();
    }

    if(isShorthand(schema) && !isJSONSchema) {
      this.shorthand = schema;
      return;
    }

    if(isJsonSchema(schema) || isJSONSchema) {
      this.jsonSchema = schema as JSONSchema7;
      return;
    }

    console.warn("[CodyWizard] Schema received invalid schema. It's neither Shorthand nor JSONSchema7 and therefor ignored!", schema);
  }

  public toShorthand(): Shorthand {
    if(this.shorthand) {
      return this.shorthand;
    }

    console.warn("[CodyWizard] Schema conversion from JSON Schema to shorthand is not implemented yet", this.jsonSchema);

    return {};
  }

  public isShorthand(): boolean {
    return isShorthand(this.toShorthandIfPossible());
  }

  public isEmpty(): boolean {
    const s = this.toShorthandIfPossible();

    if(typeof s === "string") {
      return s === '';
    }

    return Object.keys(s).length === 0;
  }

  public toShorthandIfPossible(): Shorthand | JSONSchema7 {
    if(this.shorthand) {
      return this.shorthand;
    }

    if(this.jsonSchema) {
      return convertJsonSchemaToShorthandIfPossible(this.jsonSchema);
    }

    return {};
  }

  public isString(format?: string): boolean {
    if(this.shorthand) {
      return isString(this.shorthand, format);
    }

    if(this.jsonSchema) {
      return isJsonSchemaString(this.jsonSchema, format);
    }

    return false;
  }

  public isRef(): boolean {
    if(this.shorthand) {
      return isRef(this.shorthand);
    }

    if(this.jsonSchema) {
      return isJsonSchemaRef(this.jsonSchema);
    }

    return false;
  }

  public getRef<NSV>(notSetValue?: NSV): string | NSV;
  public getRef<NSV>(notSetValue: NSV): string | NSV {
    if(!this.isRef()) {
      return notSetValue;
    }

    if(this.shorthand) {
      return typeof this.shorthand === "string" ? this.shorthand : this.shorthand.$ref as string;
    }

    if(this.jsonSchema) {
      return this.jsonSchema.$ref as string;
    }

    return notSetValue;
  }

  public getRefRuntimeInfo(sourceService: string, types: PlayInformationRegistry): PlayInformationRuntimeInfo | undefined {
    if(!this.isRef()) {
      return;
    }

    const [refWithoutProp, prop] = splitPropertyRef(this.getRef());

    if(this.shorthand) {
      try {
        return playGetVoRuntimeInfoFromDataReference(refWithoutProp, sourceService, types);
      } catch (e) {
        console.warn(`Could not resolve ref: ${this.getRef()} to a type registered in the cody play config`, e);
        return;
      }
    }

    if(this.jsonSchema) {
      const jsonSchemaRefVo = types[playFQCNFromDefinitionId(refWithoutProp)];

      if(!jsonSchemaRefVo) {
        console.warn(`Could not resolve ref: ${this.getRef()} to a type registered in the cody play config`);
        return;
      }

      return jsonSchemaRefVo;
    }
  }

  public resolveRef(sourceService: string, types: PlayInformationRegistry): Schema {
    const emptySchema = new Schema({}, !!this.jsonSchema);

    if(!this.isRef()) {
      return emptySchema;
    }

    const refInfo = this.getRefRuntimeInfo(sourceService, types);

    const [, property] = splitPropertyRef(this.getRef());

    if(refInfo) {
      const refSchema = new Schema(refInfo.schema as JSONSchema7, true);

      if(property) {
        return refSchema.getObjectPropertySchema(property, emptySchema);
      }

      return refSchema;
    }

    return emptySchema;
  }

  public isPrimitive(): boolean {
    if(this.shorthand) {
      return isPrimitive(this.shorthand);
    }

    if(this.jsonSchema) {
      return isJsonSchemaPrimitive(this.jsonSchema);
    }

    return false;
  }

  public isList(): boolean {
    if(this.shorthand) {
      return isList(this.shorthand);
    }

    if(this.jsonSchema) {
      return isJsonSchemaArray(this.jsonSchema);
    }

    return false;
  }

  public getListItemsSchema<NSV>(notSetValue?: NSV): Schema | NSV;
  public getListItemsSchema<NSV>(notSetValue: NSV): Schema | NSV {
    if(this.shorthand && isList(this.shorthand)) {
      return new Schema((this.shorthand as ShorthandObject).$items);
    }

    if(this.jsonSchema && isJsonSchemaArray(this.jsonSchema)) {
      return new Schema(this.jsonSchema.items as JSONSchema7, true);
    }

    return notSetValue;
  }

  public setListItemsSchema(schema: Schema) {
    if(!this.isList()) {
      return;
    }

    if(this.shorthand) {
      this.shorthand = {$items: schema.toShorthandIfPossible()} as ShorthandObject;
    }

    if(this.jsonSchema) {
      this.jsonSchema.items = schema.toJsonSchema();
    }
  }

  public isObject(): boolean {
    if(this.shorthand) {
      return isObject(this.shorthand);
    }

    if(this.jsonSchema) {
      return isJsonSchemaObject(this.jsonSchema);
    }

    return false;
  }

  public getDisplayNamePropertyCandidates(): string[] {
    const candidates = this.getObjectProperties().filter(prop => {
      if(prop.toLowerCase().includes('name')) {
        const propSchema = this.getObjectPropertySchema(prop, undefined);

        if(!propSchema) {
          return false;
        }

        return propSchema.isString() && !propSchema.isString('uuid');
      }
    })

    if(candidates.length) {
      return candidates;
    }

    const titleCandidates = this.getObjectProperties().filter(prop => {
      if(prop.toLowerCase().includes('title')) {
        const propSchema = this.getObjectPropertySchema(prop, undefined);

        if(!propSchema) {
          return false;
        }

        return propSchema.isString() && !propSchema.isString('uuid');
      }
    })

    if(titleCandidates.length) {
      return titleCandidates;
    }

    return this.getObjectProperties().filter(prop => {
      const propSchema = this.getObjectPropertySchema(prop, undefined);

      if(!propSchema) {
        return false;
      }

      return propSchema.isString()
        && !propSchema.isString('uuid')
        && !propSchema.isString('data-url')
    }).slice(0, 1);
  }

  public getObjectProperties(): string[] {
    if(!this.isObject()) {
      return [];
    }

    if(this.shorthand && isObject(this.shorthand)) {
      return Object.keys(this.shorthand).map(prop => prop.replace('?', ''));
    }

    if(this.jsonSchema && isJsonSchemaObject(this.jsonSchema)) {
      return Object.keys(this.jsonSchema.properties || {});
    }

    return [];
  }

  public getObjectPropertySchema<NSV>(propName: string, notSetValue?: NSV): Schema | NSV;
  public getObjectPropertySchema<NSV>(propName: string, notSetValue: NSV): Schema | NSV {
    if(!this.isObject()) {
      return notSetValue;
    }

    if(this.shorthand && isObject(this.shorthand) && this.shorthand[propName]) {
      return new Schema(this.shorthand[propName]);
    }

    if(this.shorthand && isObject(this.shorthand) && this.shorthand[propName + '?']) {
      return new Schema(this.shorthand[propName + '?']);
    }

    if(this.jsonSchema && isJsonSchemaObject(this.jsonSchema)) {
      const props = this.jsonSchema.properties || {};

      if(props[propName]) {
        return new Schema(props[propName] as JSONSchema7, true);
      }
    }

    return notSetValue;
  }

  public setObjectProperty(propName: string, propSchema: Schema, required = true): void {
    if(!this.isObject()) {
      return;
    }

    if(this.shorthand) {
      if(!required) {
        propName += '?';
      }

      // @ts-ignore
      this.shorthand[propName] = propSchema.toShorthandIfPossible();
    }

    if(this.jsonSchema) {
      // @ts-ignore
      this.jsonSchema.properties[propName] = propSchema.toJsonSchema();

      if(!required) {
        return;
      }

      if(this.jsonSchema.required) {
        this.jsonSchema.required.push(propName);
      } else {
        this.jsonSchema.required = [propName];
      }
    }
  }

  public isRequired(propName: string): boolean {
    if(this.isEmpty() || !this.isObject()) {
      return false;
    }

    if(this.shorthand) {
      if(isObject(this.shorthand) && this.shorthand[propName]) {
        return true;
      }

      // propName + ? || propName not set
      return false;
    }

    if(this.jsonSchema) {
      if(isJsonSchemaObject(this.jsonSchema) && this.jsonSchema.required && this.jsonSchema.required.includes(propName)) {
        return true;
      }
    }

    return false;
  }

  public toJsonSchema(namespace?: string): JSONSchema7 {
    if(this.jsonSchema) {
      return this.jsonSchema;
    }

    const service = playServiceFromFQCN(prepareNs(namespace || '').split('/').join('.'));

    return playNormalizeRefs(playwithErrorCheck(playJsonSchemaFromShorthand, [this.shorthand || "{}", namespace || '/']), service) as JSONSchema7;
  }

  public toString(): string {
    return JSON.stringify(this.toShorthandIfPossible(), null, 2);
  }

  public toJSON(): Shorthand | JSONSchema7 {
    return this.toShorthandIfPossible();
  }

  public equals(otherSchema: Schema): boolean {
    return isEqual(this.toJSON(), otherSchema.toJSON());
  }
}
