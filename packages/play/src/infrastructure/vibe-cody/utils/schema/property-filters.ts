import {Filter as QueryFilter} from "@app/shared/value-object/query/filter-types";
import {PlayInformationRuntimeInfo} from "@cody-play/state/types";
import {CodyResponse, CodyResponseType} from "@proophboard/cody-types";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {Schema} from "@cody-play/infrastructure/vibe-cody/utils/schema/schema";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import {JSONSchema7} from "json-schema";
import {playServiceFromFQCN} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import {get} from "lodash";

export type FilterType = 'isEqual' | 'isNotEqual' | 'isGreaterThan' | 'isGreaterThanOrEqual' | 'isLessThan' | 'isLessThanOrEqual';

export type ValueType = 'fixed' | 'now' | 'user' | 'userAttr' | 'expr';

export type FilterCollection = Array<Filter | NowFilter | UserAttributeFilter>;

export interface Filter {
  prop: string;
  type: FilterType;
  value: unknown;
  valueType: ValueType;
  schemaType: SchemaType;
}

export type NowType = 'isoDate' | 'isoTime' | 'isoDateTime';

export type SchemaType = 'string' | 'integer' | 'number' | 'boolean' | 'object' | 'array' | 'null';

export interface NowFilter extends Filter {
  nowType: NowType;
}

export const isNowFilter = (filter: Filter): filter is NowFilter => {
  return filter.valueType === "now";
}

export interface UserAttributeFilter extends Filter {
  attribute: string;
}

export const isFixedFilter = (filter: Filter): boolean => {
  return filter.valueType === "fixed";
}

export const isDynamicFilter = (filter: Filter): boolean => {
  return !isFixedFilter(filter);
}

export const isUserAttributeFilter = (filter: Filter): filter is UserAttributeFilter => {
  return filter.valueType === "userAttr";
}

export const convertFilters = (filters: FilterCollection): QueryFilter | CodyResponse => {
  if(filters.length === 0) {
    return {any: true}
  }

  if(filters.length === 1) {
    return convertFilter(filters[0]);
  }

  const and = filters.map(convertFilter);

  for (const queryFilter of and) {
    if(playIsCodyError(queryFilter)) {
      return queryFilter;
    }
  }

  return {
    and: and as QueryFilter[],
  }
}

const convertFilter = (filter: Filter): QueryFilter | CodyResponse => {
  const expr = makeFilterValueExpr(filter);

  if(playIsCodyError(expr)) {
    return expr;
  }

  const mapping = {
    prop: filter.prop,
    value: expr
  };

  switch (filter.type) {
    case "isEqual":
      return {
        eq: mapping
      }
    case "isNotEqual":
      return {
        not: {
          eq: mapping
        }
      }
    case "isGreaterThan":
      return {
        gt: mapping
      }
    case "isGreaterThanOrEqual":
      return {
        gte: mapping
      }
    case "isLessThan":
      return {
        lt: mapping
      }
    case "isLessThanOrEqual":
      return {
        lte: mapping
      }
  }
}

const makeFilterValueExpr = (filter: Filter): string | CodyResponse => {
  if(isFixedFilter(filter)) {
    return `$> ${filter.schemaType === "string" ? `'${filter.value}'` : filter.value}`;
  } else {
    if(isNowFilter(filter)) {
      return `$> now()|${filter.nowType}()`
    }

    if(isUserAttributeFilter(filter)) {
      return `$> meta.user|attr('${filter.attribute}')`
    }

    if(filter.valueType === "user") {
      return `$> meta.user.userId`
    }

    if(filter.valueType === "expr") {
      return filter.value as string;
    }
  }

  return {
    cody: `Sorry, I don't understand the filter: ${JSON.stringify(filter)}`,
    details: `This seems to be a bug. Please contact the prooph board team!`,
    type: CodyResponseType.Error
  }
}

export const parseFilters = (input: string, stateVO: PlayInformationRuntimeInfo, config: CodyPlayConfig): FilterCollection  => {
  if(input === '') {
    return [];
  }

  const lines = input.split(`\n`);

  const filters: FilterCollection = [];

  lines.forEach(line => {
    const filter = parseFilter(line, stateVO, config);

    if(!filter) {
      return;
    }

    filters.push(filter);
  })

  return filters;
}

const parseFilter = (line: string, stateVO: PlayInformationRuntimeInfo, config: CodyPlayConfig): Filter | NowFilter | UserAttributeFilter | undefined => {
  if(!line.includes(":")) {
    return;
  }

  const [propPart, filterPart] = line.split(`:`).map(l => l.trim());

  const prop = propPart.replace('- ', '').trim();

  const match = filterPart.match(/^(?<filter>[a-zA-Z]+)\((?<value>.*)\)$/);

  if(!match) {
    return;
  }

  const filterType = match['groups']!['filter'];
  const value = match['groups']!['value'];

  if(!isValidFilterType(filterType)) {
    return;
  }

  return parseFilterValue(prop, value, filterType, stateVO, config);
}

const isValidFilterType = (type: string): type is FilterType => {
  switch (type) {
    case "isEqual":
    case "isNotEqual":
    case "isGreaterThan":
    case "isGreaterThanOrEqual":
    case "isLessThan":
    case "isLessThanOrEqual":
      return true;
    default:
      return false;
  }
}

const parseFilterValue = (prop: string, value: string, filterType: FilterType, stateVO: PlayInformationRuntimeInfo, config: CodyPlayConfig): Filter | NowFilter | UserAttributeFilter | undefined => {
  value = value.trim();
  const match = value.match(/^(?<type>[a-zA-Z]+)\((?<value>.*)\)$/);

  const schemaType = getSchemaTypeFromSchema(prop, stateVO, config);

  if(!match) {
    return {
      type: filterType,
      prop,
      value,
      valueType: "fixed",
      schemaType
    }
  }

  const valueType = match['groups']!['type'];

  if(!isValidValueType(valueType)) {
    return {
      type: filterType,
      prop,
      value,
      valueType: "fixed",
      schemaType
    }
  }

  value = match['groups']!['value'];

  if(!value) {
    value = '';
  } else {
    value = value.trim();
  }



  switch (valueType) {
    case "now":
      return {
        type: filterType,
        prop,
        value: '',
        valueType: "now",
        nowType: getNowTypeFromSchema(prop, stateVO, config),
        schemaType: "string"
      }
    case "user":
      return {
        type: filterType,
        prop,
        value: '',
        valueType: "user",
        schemaType: "string"
      }
    case "userAttr":
      return {
        type: filterType,
        prop,
        value: '',
        valueType: "userAttr",
        attribute: value,
        schemaType: "string"
      }
    case "expr":
      return {
        type: filterType,
        prop,
        value,
        valueType: "expr",
        schemaType
      }
  }
}

const isValidValueType = (valueType: string): valueType is ValueType => {
  switch (valueType) {
    case "fixed":
    case "now":
    case "user":
    case "userAttr":
    case "expr":
      return true;
    default:
      return false;
  }
}

const getSchemaTypeFromSchema = (prop: string, stateVO: PlayInformationRuntimeInfo, config: CodyPlayConfig): SchemaType => {
  let schema = new Schema(cloneDeepJSON(stateVO.schema) as JSONSchema7, true);

  if(schema.isRef()) {
    schema = schema.resolveRef(playServiceFromFQCN(stateVO.desc.name), config.types);
  }

  const jsonSchema = schema.toJsonSchema();

  const propSchema = get(jsonSchema, `properties.${prop}`, {type: "string"}) as JSONSchema7;

  if(!propSchema.type) {
    return "string"
  }

  if(Array.isArray(propSchema.type)) {
    return propSchema.type[0];
  }

  return propSchema.type;
}

const getNowTypeFromSchema = (prop: string, stateVO: PlayInformationRuntimeInfo, config: CodyPlayConfig): NowType => {
  let schema = new Schema(cloneDeepJSON(stateVO.schema) as JSONSchema7, true);

  if(schema.isRef()) {
    schema = schema.resolveRef(playServiceFromFQCN(stateVO.desc.name), config.types);
  }

  const propSchema = schema.getObjectPropertySchema(prop, new Schema({}));

  if(propSchema.isString('date')) {
    return "isoDate";
  }

  if(propSchema.isString("time")) {
    return "isoTime";
  }

  return "isoDateTime";
}
