import {JSONSchema7} from "json-schema-to-ts";
import {User} from "@app/shared/types/core/user/user";
import {filters} from "@event-engine/infrastructure/DocumentStore/Filter/index";
import {QueryableStateListDescription, QueryableValueObjectDescription} from "@event-engine/descriptions/descriptions";
import {ResolveConfig} from "@cody-engine/cody/hooks/utils/value-object/types";
import {SortOrder, SortOrderItem} from "@event-engine/infrastructure/DocumentStore";
import {Filter as DSFilter} from "@event-engine/infrastructure/DocumentStore/Filter";
import {
  isExecuteRules,
  isFilter,
  isIfConditionRule,
  isIfNotConditionRule
} from "@cody-engine/cody/hooks/utils/rule-engine/configuration";
import {
  Filter,
  isAndFilter,
  isAnyOfDocIdFilter,
  isAnyOfFilter,
  isDocIdFilter,
  isEqFilter,
  isExistsFilter,
  isGteFilter,
  isGtFilter,
  isInArrayFilter, isLikeFilter, isLteFilter, isLtFilter,
  isNotFilter,
  isOrFilter
} from "@cody-engine/cody/hooks/utils/value-object/query/filter-types";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {isObjectSchema} from "@cody-play/infrastructure/cody/schema/check";

export const makeFiltersFromResolveConfig = (desc: QueryableStateListDescription | QueryableValueObjectDescription, resolve: ResolveConfig, queryPayload: any, user: User): DSFilter => {
  const rule = resolve.where;
  const ctx = {query: queryPayload, meta: {user: user}};

  if(!rule) {
    return makeAnyFilter();
  }

  if(!isFilter(rule.then)) {
    throw new Error(`A resolve configuration should only contain a single filter rule. Please check resolve of Card "${desc.name}".`);
  }

  if(isIfConditionRule(rule) || isIfNotConditionRule(rule)) {
    if (rule.else && !isFilter(rule.else) && (!isExecuteRules(rule.else) || rule.else.execute.rules.length !== 1)) {
      throw new Error(`The "else" part of a conditional resolve configuration should only contain a single filter rule. Please check resolve of Card "${desc.name}".`);
    }
  }

  if(isIfConditionRule(rule)) {
    if(jexl.evalSync(rule.if, ctx)) {
      return makeFilter(rule.then.filter, ctx);
    }
  }

  if(isIfNotConditionRule(rule)) {
    if(!jexl.evalSync(rule.if_not, ctx)) {
      return makeFilter(rule.then.filter, ctx);
    }
  }

  if(isIfConditionRule(rule) || isIfNotConditionRule(rule)) {
    if(rule.else && isFilter(rule.else)) {
      return makeFilter(rule.else.filter, ctx);
    }

    if(rule.else && isExecuteRules(rule.else)) {
      return makeFiltersFromResolveConfig(desc, {where: rule.else.execute.rules[0]}, queryPayload, user);
    }

    return makeAnyFilter();
  }

  return makeFilter(rule.then.filter, ctx);
}

export const makeFiltersFromQuerySchema = (schema: JSONSchema7, params: any, user: User): DSFilter => {

  const properties = isObjectSchema(schema) ? Object.keys(schema.properties) : [];

  if(properties.length === 0) {
    return makeAnyFilter();
  }

  if(properties.length === 1) {
    const propName = properties[0];

    if(isObjectSchema(schema) && schema.required && !schema.required.includes(propName)) {
      return params[propName] ? makeEqFilterFromProperty(propName, params) : makeAnyFilter();
    }

    return makeEqFilterFromProperty(propName, params);
  }

  const eqFilters: DSFilter[] = [];

  properties.forEach(prop => {
    eqFilters.push(makeEqFilterFromProperty(prop, params));
  })

  return new filters.AndFilter(eqFilters[0], eqFilters[1], ...eqFilters.slice(2));
}

const makeEqFilterFromProperty = (prop: string, params: any): DSFilter => {
  return new filters.EqFilter(`${prop}`, params[prop] || '$codyplay__not_set_value__');
}

export const makeFilter = (filter: Filter, ctx: any): DSFilter => {
  if(isAndFilter(filter)) {
    const mappedFilters = filter.and.map(f => makeFilter(f, ctx));

    if(mappedFilters.length < 2) {
      throw new Error(`An AndFilter of a resolve config should contain at least two sub filters. Please check the resolve config`);
    }

    return new filters.AndFilter(mappedFilters[0], mappedFilters[1], ...mappedFilters.slice(2));
  }

  if(isOrFilter(filter)) {
    const mappedFilters = filter.or.map(f => makeFilter(f, ctx));

    if(mappedFilters.length < 2) {
      throw new Error(`An OrFilter of a resolve config should contain at least two sub filters. Please check the resolve config`);
    }

    return new filters.OrFilter(mappedFilters[0], mappedFilters[1], ...mappedFilters.slice(2));
  }

  if(isNotFilter(filter)) {
    return new filters.NotFilter(makeFilter(filter.not, ctx));
  }

  if(isAnyOfDocIdFilter(filter)) {
    return new filters.AnyOfDocIdFilter(execExpr(filter.anyOfDocId, ctx));
  }

  if(isAnyOfFilter(filter)) {
    return new filters.AnyOfFilter(`${filter.anyOf.prop}`, execExpr(filter.anyOf.valueList, ctx));
  }

  if(isDocIdFilter(filter)) {
    return new filters.DocIdFilter(execExpr(filter.docId, ctx));
  }

  if(isEqFilter(filter)) {
    return new filters.EqFilter(`${filter.eq.prop}`, execExpr(filter.eq.value, ctx));
  }

  if(isExistsFilter(filter)) {
    return new filters.ExistsFilter(`${filter.exists.prop}`);
  }

  if(isGteFilter(filter)) {
    return new filters.GteFilter(`${filter.gte.prop}`, execExpr(filter.gte.value, ctx));
  }

  if(isGtFilter(filter)) {
    return new filters.GtFilter(`${filter.gt.prop}`, execExpr(filter.gt.value, ctx));
  }

  if(isInArrayFilter(filter)) {
    return new filters.InArrayFilter(`${filter.inArray.prop}`, execExpr(filter.inArray.value, ctx));
  }

  if(isLikeFilter(filter)) {
    return new filters.LikeFilter(`${filter.like.prop}`, execExpr(filter.like.value, ctx));
  }

  if(isLteFilter(filter)) {
    return new filters.LteFilter(`${filter.lte.prop}`, execExpr(filter.lte.value, ctx));
  }

  if(isLtFilter(filter)) {
    return new filters.LtFilter(`${filter.lt.prop}`, execExpr(filter.lt.value, ctx));
  }

  return makeAnyFilter();
}

const makeAnyFilter = (): DSFilter => {
  return new filters.AnyFilter();
}

const execExpr = (expr: string, ctx: any): any => {
  return jexl.evalSync(expr, ctx);
}
