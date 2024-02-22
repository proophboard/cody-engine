import {CodyResponse, CodyResponseType, Node} from "@proophboard/cody-types";
import {Context} from "../../context";
import {
  isQueryableListDescription,
  isQueryableNotStoredStateDescription,
  isQueryableNotStoredValueObjectDescription,
  isQueryableStateDescription,
  isQueryableStateListDescription,
  isQueryableValueObjectDescription,
  QueryableListDescription,
  QueryableNotStoredStateDescription,
  QueryableNotStoredValueObjectDescription,
  QueryableStateDescription,
  QueryableStateListDescription,
  QueryableValueObjectDescription
} from "@event-engine/descriptions/descriptions";
import {names} from "@event-engine/messaging/helpers";
import {isObjectSchema, ObjectSchema} from "../json-schema/is-object-schema";
import {voClassNameFromFQCN} from "../value-object/definitions";
import {JSONSchema7} from "json-schema-to-ts";
import {isExecuteRules, isFilter, isIfConditionRule, isIfNotConditionRule} from "../rule-engine/configuration";
import {convertRuleConfigToQueryResolverRules, wrapExpression} from "../rule-engine/convert-rule-config-to-behavior";
import {
  AnyOfDocIdFilter,
  AnyOfFilter,
  DocIdFilter,
  EqFilter,
  ExistsFilter,
  Filter,
  GteFilter,
  GtFilter,
  InArrayFilter,
  isAndFilter,
  isAnyFilter,
  isAnyOfDocIdFilter,
  isAnyOfFilter,
  isDocIdFilter,
  isEqFilter,
  isExistsFilter,
  isGteFilter,
  isGtFilter,
  isInArrayFilter, isLikeFilter, isLteFilter, isLtFilter,
  isNotFilter,
  isOrFilter,
  LikeFilter,
  LteFilter,
  LtFilter
} from "../value-object/query/filter-types";
import {SortOrder, SortOrderItem} from "@event-engine/infrastructure/DocumentStore";
import {isCodyError} from "@proophboard/cody-utils";
import {ResolveConfig, ValueObjectMetadata} from "@cody-engine/cody/hooks/utils/value-object/types";
import {mapOrderBy} from "@cody-engine/cody/hooks/utils/query/map-order-by";
import {requireUncachedTypes} from "@cody-engine/cody/hooks/utils/value-object/require-uncached-types";
import {voRegistryId} from "@cody-engine/cody/hooks/utils/value-object/vo-registry-id";
import {withErrorCheck} from "@cody-engine/cody/hooks/utils/error-handling";

export const makeQueryResolver = (vo: Node, voMeta: ValueObjectMetadata, ctx: Context): string | CodyResponse => {
  if(!voMeta.isQueryable) {
    return {
      cody: `Oh, something went wrong. A non queryable value object is passed to makeQueryResolver. The Value Object node is: "${vo.getName()}"`,
      type: CodyResponseType.Error,
      details: `This seems to be a developer bug and should not happen. Please contact the prooph board team to let them fix the problem!`
    }
  }

  if(isQueryableNotStoredStateDescription(voMeta)) {
    return makeSingleValueObjectQueryResolver(vo, voMeta, ctx);
  }

  if(isQueryableStateDescription(voMeta)) {
    return makeStateQueryResolver(vo, voMeta, ctx);
  }

  if(isQueryableStateListDescription(voMeta) || isQueryableListDescription(voMeta)) {
    return makeListQueryResolver(vo, voMeta, ctx);
  }

  if(isQueryableValueObjectDescription(voMeta)) {
    return makeSingleValueObjectQueryResolver(vo, voMeta, ctx);
  }

  if(isQueryableNotStoredValueObjectDescription(voMeta)) {
    return makeSingleValueObjectQueryResolver(vo, voMeta, ctx);
  }

  return {
    cody: `Oh, something went wrong. A queryable value object is passed to makeQueryResolver, but it is neither queryable state nor queryable state list. The value object node is: "${vo.getName()}"`,
    type: CodyResponseType.Error,
    details: `This seems to be a developer bug and should not happen. Please contact the prooph board team to let them fix the problem!`
  }
}

const makeSingleValueObjectQueryResolver = (vo: Node, meta: ValueObjectMetadata & (QueryableValueObjectDescription | QueryableNotStoredStateDescription | QueryableNotStoredValueObjectDescription), ctx: Context): string | CodyResponse => {
  const voNames = names(vo.getName());
  const querySchema = meta.querySchema;

  const codyQuerySchemaError = {
    cody: `Value object "${vo.getName()}" represents a queryable value object, but the querySchema does not match.`,
    type: CodyResponseType.Error,
    details: `You can solve the issue by using properties of the value object within the querySchema.`
  };

  if(!isObjectSchema(querySchema!)) {
    return codyQuerySchemaError;
  }

  const filters = meta.resolve?.where ? makeFiltersFromResolveConfig(vo, meta.resolve) : makeFiltersFromQuerySchema(querySchema);

  let jexlInit = '';
  let jexlRules = '';
  let orderBy = 'undefined';

  if(meta.resolve) {
    if(meta.resolve.where || meta.resolve.rules) {
      jexlInit = `const ctx: any = {...deps, query: query.payload, meta: query.meta}\nctx[INFORMATION_SERVICE_NAME] = infoService;\n`;
    }

    if(meta.resolve.rules) {
      jexlRules = withErrorCheck(convertRuleConfigToQueryResolverRules, [vo, ctx, meta.resolve.rules, '  ']);
    }

    if(meta.resolve.orderBy) {
      orderBy = JSON.stringify(mapOrderBy(meta.resolve.orderBy));
    }
  }

  if(meta.collection) {
    return `${jexlInit}
  ${jexlRules}  
  const cursor = await ds.findDocs<${voNames.className}>(
    ${voNames.className}Desc.collection,
    ${filters},
    undefined,
    1,
    ${orderBy}
  );
  
  const result = await asyncIteratorToArray(asyncMap(cursor, ([,d]) => ${names(voNames.className).propertyName}(d)));
  if(result.length !== 1) {
    throw new NotFoundError(\`${voNames.className} with "\${JSON.stringify(query.payload)}" not found!\`);
  }
  
  return result[0];
`
  }

  return `${jexlInit}
  ${jexlRules}
  
  if(typeof ctx['information'] === 'undefined') {
    throw new Error('The resolver rules did not assign an "information" variable that can be used as return value. Please check the query resolver config for ${vo.getName()} on prooph board.');
  }
  
  return ${names(voNames.className).propertyName}(ctx['information']);
  `
}

const makeStateQueryResolver = (vo: Node, meta: ValueObjectMetadata & QueryableStateDescription, ctx: Context): string | CodyResponse => {
  const voNames = names(vo.getName());
  const querySchema = meta.querySchema;

  const codyQuerySchemaError = {
    cody: `Value object "${vo.getName()}" represents state identified by its property: "${meta.identifier}", but the querySchema does not match.`,
    type: CodyResponseType.Error,
    details: `You can solve the issue by setting querySchema to: \n{\n  ${meta.identifier}: "string"\n}`
  };

  if(!isObjectSchema(querySchema!)) {
    return codyQuerySchemaError;
  }

  const props = querySchema.properties;

  if(Object.keys(querySchema.properties).length !== 1 || typeof props[meta.identifier] === "undefined") {
    return codyQuerySchemaError;
  }

  return `const doc = await ds.getDoc<${voNames.className}>(${voNames.className}Desc.collection, query.payload.${meta.identifier});
  
  if(!doc) {
    throw new NotFoundError(\`${voNames.className} with ${meta.identifier}: "\${query.payload.${meta.identifier}}" not found!\`);
  }
  
  return ${voNames.propertyName}(doc);
`
}

const makeListQueryResolver = (vo: Node, meta: ValueObjectMetadata & (QueryableStateListDescription | QueryableListDescription ), ctx: Context): string | CodyResponse => {
  const voNames = names(vo.getName());
  const querySchema = meta.querySchema;

  const codyQuerySchemaError = {
    cody: `Value object "${vo.getName()}" represents a list of queryable state objects: "${vo.getName()}", but the querySchema is not an object schema of filter properties.`,
    type: CodyResponseType.Error,
    details: `You can solve the issue by setting querySchema to: {}`
  };

  if(!isObjectSchema(querySchema!)) {
    return codyQuerySchemaError;
  }

  const filters = meta.resolve?.where ? makeFiltersFromResolveConfig(vo, meta.resolve) : makeFiltersFromQuerySchema(querySchema);

  const itemClassName = voClassNameFromFQCN(meta.itemType);

  let jexlInit = '';
  let jexlRules = '';
  let orderBy = 'undefined';

  if(meta.resolve) {
    if(meta.resolve.where || meta.resolve.rules) {
      jexlInit = `const ctx: any = {...deps, query: query.payload, meta: query.meta}\n  ctx[INFORMATION_SERVICE_NAME] = infoService;\n`;
    }

    if(meta.resolve.rules) {
      jexlRules = withErrorCheck(convertRuleConfigToQueryResolverRules, [vo, ctx, meta.resolve.rules, '  ']);
    }

    if(meta.resolve.orderBy) {
      orderBy = JSON.stringify(mapOrderBy(meta.resolve.orderBy));
    }
  }

  if(meta.collection) {
    return `${jexlInit}
  ${jexlRules}
  const cursor = await ds.findDocs<${itemClassName}>(
    ${voNames.className}Desc.collection,
    ${filters},
    undefined,
    undefined,
    ${orderBy}
  );
  
  return asyncIteratorToArray(asyncMap(cursor, ([,d]) => ${names(itemClassName).propertyName}(d)));
`
  }

  return `${jexlInit}
  ${jexlRules}
  
  if(typeof ctx['information'] === 'undefined') {
    throw new Error('The resolver rules did not assign an "information" variable that can be used as return value. Please check the query resolver config for ${vo.getName()} on prooph board.');
  }
  
  if(!Array.isArray(ctx['information'])) {
    throw new Error('The "information" variable assigned in the rules is not a list. Please check the query resolver config for ${vo.getName()} on prooph board.');
  }
  
  return ctx['information'].map(item => ${names(itemClassName).propertyName}(item));
`
}

const makeFiltersFromResolveConfig = (vo: Node, resolveConfig: ResolveConfig, indent = '  '): string | CodyResponse => {
  const lines: string[] = [];

  const rule = resolveConfig.where;

  if(!rule) {
    return makeAnyFilter();
  }

  if(!isFilter(rule.then)) {
    return  {
      cody: `A resolve configuration should only contain a single filter rule. Please check resolve of Card "${vo.getName()}".`,
      type: CodyResponseType.Error,
      details: `An example of a filter rule is: { rule: "always", then: { filter: { any: true } } }`
    }
  }

  if(isIfConditionRule(rule) || isIfNotConditionRule(rule)) {
    if(rule.else && !isFilter(rule.else) && (!isExecuteRules(rule.else) || rule.else.execute.rules.length !== 1)) {
      return  {
        cody: `The "else" part of a conditional resolve configuration should only contain a single filter rule. Please check resolve of Card "${vo.getName()}".`,
        type: CodyResponseType.Error,
        details: `An example of a filter rule is: {\n  rule: "condition",\n  if: "query.optionalProperty",\n  then: {\n    filter: { eq: { prop: "optionalProperty", value: "query.optionalProperty"}\n }\n    }\n  else: { filter: { any: true } }\n}`
      }
    }
  }

  if(isIfConditionRule(rule)) {

    const expr = rule.if;

    lines.push(`${indent}(${wrapExpression(expr)}) ?`);

    makeFilter(rule.then.filter, lines, indent + '  ');

    lines.push(`${indent}:`);

    if(rule.else && isFilter(rule.else)) {
      makeFilter(rule.else.filter, lines, indent + '  ');
    } else if (rule.else && isExecuteRules(rule.else)) {
      const ifElseFilters = makeFiltersFromResolveConfig(vo, {where: rule.else.execute.rules[0]}, indent + '  ');

      if(isCodyError(ifElseFilters)) {
        return ifElseFilters;
      }

      lines.push(ifElseFilters);
    } else {
      lines.push(`${indent}  ${makeAnyFilter()}`)
    }

  } else if(isIfNotConditionRule(rule)) {
    const ifNotexpr = rule.if_not;

    lines.push(`${indent}!(${wrapExpression(ifNotexpr)}) ?`);

    makeFilter(rule.then.filter, lines, indent + '  ');

    lines.push(`${indent}:`);

    if(rule.else && isFilter(rule.else)) {
      makeFilter(rule.else.filter, lines, indent + '  ');
    } else if (rule.else && isExecuteRules(rule.else)) {
      const ifNotElseFilters = makeFiltersFromResolveConfig(vo, {where: rule.else.execute.rules[0]}, indent + '  ');

      if(isCodyError(ifNotElseFilters)) {
        return ifNotElseFilters;
      }

      lines.push(ifNotElseFilters);
    }else {
      lines.push(`${indent}  ${makeAnyFilter()}`)
    }
  } else {
    makeFilter(rule.then.filter, lines, indent);
  }

  return lines.join("\n");
}

export const makeFilter = (filter: Filter, lines: string[], indent = '', endOfLine = '') => {
  if (isAndFilter(filter)) {
    lines.push(`${indent}new filters.AndFilter(`);

    filter.and.forEach(f => makeFilter(f, lines, indent + '  ', ','));

    lines.push(`${indent})${endOfLine}`);

  } else if (isOrFilter(filter)) {
    lines.push(`${indent}new filters.OrFilter(`);

    filter.or.forEach(f => makeFilter(f, lines, indent + '  ', ','));

    lines.push(`${indent})${endOfLine}`);

  } else if (isNotFilter(filter)) {
    lines.push(`${indent}new filters.NotFilter(`);

    makeFilter(filter.not, lines, indent + '  ');

    lines.push(`${indent})${endOfLine}`);
  } else if (isAnyOfDocIdFilter(filter)) {
    lines.push(`${indent}${makeAnyOfDocIdFilter(filter)}${endOfLine}`);

  } else if (isAnyOfFilter(filter)) {
    lines.push(`${indent}${makeAnyOfFilter(filter)}${endOfLine}`);

  } else if (isDocIdFilter(filter)) {
    lines.push(`${indent}${makeDocIdFilter(filter)}${endOfLine}`);

  } else if (isEqFilter(filter)) {
    lines.push(`${indent}${makeEqFilter(filter)}${endOfLine}`);

  } else if (isExistsFilter(filter)) {
    lines.push(`${indent}${makeExistsFilter(filter)}${endOfLine}`);

  } else if (isGteFilter(filter)) {
    lines.push(`${indent}${makeGteFilter(filter)}${endOfLine}`);

  } else if (isGtFilter(filter)) {
    lines.push(`${indent}${makeGtFilter(filter)}${endOfLine}`);

  } else if (isInArrayFilter(filter)) {
    lines.push(`${indent}${makeInArrayFilter(filter)}${endOfLine}`);

  } else if (isLikeFilter(filter)) {
    lines.push(`${indent}${makeLikeFilter(filter)}${endOfLine}`);

  } else if (isLteFilter(filter)) {
    lines.push(`${indent}${makeLteFilter(filter)}${endOfLine}`);

  } else if (isLtFilter(filter)) {
    lines.push(`${indent}${makeLtFilter(filter)}${endOfLine}`);

  } else {
    lines.push(`${indent}${makeAnyFilter()}${endOfLine}`);
  }
}

const makeFiltersFromQuerySchema = (querySchema: ObjectSchema): string => {
  const properties = Object.keys(querySchema.properties);

  if(properties.length === 0) {
    return makeAnyFilter();
  }

  if(properties.length === 1) {
    const propName = properties[0];
    const eqFilter = makeEqFilterFromPropertySchema(propName, querySchema.properties[propName]);

    if(!querySchema.required.includes(propName)) {
      return `typeof query.payload.${propName} !== 'undefined' ? ${eqFilter} : ${makeAnyFilter()}`
    } else {
      return eqFilter;
    }
  }

  let andFilter = "new filters.AndFilter(\n";
  properties.forEach(prop => {
    andFilter += makeEqFilterFromPropertySchema(prop, querySchema.properties[prop], '    ') + ",\n";
  })
  andFilter += ")"

  return andFilter;
}

const makeAnyFilter = (): string => {
  return 'new filters.AnyFilter()';
}

const makeAnyOfDocIdFilter = (filter: AnyOfDocIdFilter): string => {
  return `new filters.AnyOfDocIdFilter(${wrapExpression(filter.anyOfDocId)})`;
}

const makeAnyOfFilter = (filter: AnyOfFilter): string => {
  return `new filters.AnyOfFilter('${filter.anyOf.prop}', ${wrapExpression(filter.anyOf.valueList)})`;
}

const makeDocIdFilter = (filter: DocIdFilter): string => {
  return `new filters.DocIdFilter(${wrapExpression(filter.docId)})`;
}

const makeEqFilter = (filter: EqFilter): string => {
  return `new filters.EqFilter('${filter.eq.prop}', ${wrapExpression(filter.eq.value)})`
}

const makeExistsFilter = (filter: ExistsFilter): string => {
  return `new filters.ExistsFilter('${filter.exists.prop}')`;
}

const makeGteFilter = (filter: GteFilter): string => {
  return `new filters.GteFilter('${filter.gte.prop}', ${wrapExpression(filter.gte.value)})`;
}

const makeGtFilter = (filter: GtFilter): string => {
  return `new filters.GtFilter('${filter.gt.prop}', ${wrapExpression(filter.gt.value)})`;
}

const makeInArrayFilter = (filter: InArrayFilter): string => {
  return `new filters.InArrayFilter('${filter.inArray.prop}', ${wrapExpression(filter.inArray.value)})`;
}

const makeLikeFilter = (filter: LikeFilter): string => {
  return `new filters.LikeFilter('${filter.like.prop}', ${wrapExpression(filter.like.value)})`;
}

const makeLteFilter = (filter: LteFilter): string => {
  return `new filters.LteFilter('${filter.lte.prop}', ${wrapExpression(filter.lte.value)})`;
}

const makeLtFilter = (filter: LtFilter): string => {
  return `new filters.LtFilter('${filter.lt.prop}', ${wrapExpression(filter.lt.value)})`;
}

const makeEqFilterFromPropertySchema = (prop: string, schema: JSONSchema7, indent = ''): string => {

  return `${indent}new filters.EqFilter("${prop}", query.payload.${prop})`;
}
