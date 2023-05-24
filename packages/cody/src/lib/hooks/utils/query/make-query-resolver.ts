import {CodyResponse, CodyResponseType, Node} from "@proophboard/cody-types";
import {ValueObjectMetadata} from "../value-object/get-vo-metadata";
import {Context} from "../../context";
import {
  isQueryableStateDescription,
  isQueryableStateListDescription,
  QueryableStateDescription,
  QueryableStateListDescription
} from "@event-engine/descriptions/descriptions";
import {names} from "@event-engine/messaging/helpers";
import {objectSchema} from "../json-schema/object-schema";
import {voClassNameFromFQCN} from "../value-object/definitions";

export const makeQueryResolver = (vo: Node, voMeta: ValueObjectMetadata, ctx: Context): string | CodyResponse => {
  if(!voMeta.isQueryable) {
    return {
      cody: `Oh, something went wrong. A non queryable value object is passed to makeQueryResolver. The Value Object node is: "${vo.getName()}"`,
      type: CodyResponseType.Error,
      details: `This seems to be a developer bug and should not happen. Please contact the prooph board team to let them fix the problem!`
    }
  }

  if(isQueryableStateDescription(voMeta)) {
    return makeStateQueryResolver(vo, voMeta, ctx);
  }

  if(isQueryableStateListDescription(voMeta)) {
    return makeListQueryResolver(vo, voMeta, ctx);
  }

  return {
    cody: `Oh, something went wrong. A queryable value object is passed to makeQueryResolver, but it is neither queryable state nor queryable state list. The value object node is: "${vo.getName()}"`,
    type: CodyResponseType.Error,
    details: `This seems to be a developer bug and should not happen. Please contact the prooph board team to let them fix the problem!`
  }
}

const makeStateQueryResolver = (vo: Node, meta: ValueObjectMetadata & QueryableStateDescription, ctx: Context): string | CodyResponse => {
  const voNames = names(vo.getName());
  const querySchema = meta.querySchema;

  const codyQuerySchemaError = {
    cody: `Value object "${vo.getName()}" represents state identified by its property: "${meta.identifier}", but the querySchema does not match.`,
    type: CodyResponseType.Error,
    details: `You can solve the issue by setting querySchema to: \n{\n  ${meta.identifier}: "string"\n}`
  };

  if(!objectSchema(querySchema!)) {
    return codyQuerySchemaError;
  }

  const props = querySchema.properties;

  if(Object.keys(querySchema.properties).length !== 1 || typeof props[meta.identifier] === "undefined") {
    return codyQuerySchemaError;
  }

  return `const doc = await ds.getDoc<{state: ${voNames.className}}>(${voNames.className}Desc.collection, query.payload.${meta.identifier});
  
  if(!doc) {
    throw new NotFoundError(\`${voNames.className} with ${meta.identifier}: "\${query.payload.${meta.identifier}}" not found!\`);
  }
  
  return ${voNames.propertyName}(doc.state);
`
}

const makeListQueryResolver = (vo: Node, meta: ValueObjectMetadata & QueryableStateListDescription, ctx: Context): string | CodyResponse => {
  const voNames = names(vo.getName());
  const querySchema = meta.querySchema;

  const codyQuerySchemaError = {
    cody: `Value object "${vo.getName()}" represents a list of queryable state objects: "${vo.getName()}", but the querySchema is not supported. At the moment you can only use an empty query schema.`,
    type: CodyResponseType.Error,
    details: `You can solve the issue by setting querySchema to: {}`
  };

  if(!objectSchema(querySchema!)) {
    return codyQuerySchemaError;
  }

  if(Object.keys(querySchema.properties).length !== 0) {
    return codyQuerySchemaError;
  }

  const itemClassName = voClassNameFromFQCN(meta.itemType);

  return `const cursor = await ds.findDocs<{state: ${itemClassName}}>(
    ${voNames.className}Desc.collection,
    new AnyFilter()
  );
  
  return asyncIteratorToArray(asyncMap(cursor, ([,d]) => ${names(itemClassName).propertyName}(d.state)));
`
}
