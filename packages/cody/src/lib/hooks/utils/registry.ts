import {CodyResponse, CodyResponseType, Node, NodeType} from "@proophboard/cody-types";
import {Context} from "../context";
import {FsTree} from "nx/src/generators/tree";
import {loadDescription} from "./prooph-board-info";
import {getSingleSource, getSourcesOfType, isCodyError, nodeNameToPascalCase} from "@proophboard/cody-utils";
import {
  ArrayLiteralExpression, AsExpression,
  ObjectLiteralExpression,
  Project,
  PropertyAssignment,
  ScriptTarget,
  SourceFile,
  SyntaxKind,
  TupleTypeNode
} from "ts-morph";
import {joinPathFragments} from "nx/src/utils/path";
import {detectService} from "./detect-service";
import {names} from "@event-engine/messaging/helpers";
import {isNewFile} from "./fs-tree";
import {getVoMetadata} from "./value-object/get-vo-metadata";
import {namespaceToClassName, namespaceToFilePath, namespaceToJSONPointer} from "./value-object/namespace";
import {getEventMetadata} from "./event/get-event-metadata";
import {getNodeFromSyncedNodes} from "./node-tree";
import {ValueObjectMetadata} from "@cody-engine/cody/hooks/utils/value-object/types";
import {getOriginalEvent} from "@cody-engine/cody/hooks/utils/event/get-original-event";
import {findAggregateState} from "@cody-engine/cody/hooks/utils/aggregate/find-aggregate-state";
import {isObjectSchema} from "@cody-engine/cody/hooks/utils/json-schema/is-object-schema";

const project = new Project({
  compilerOptions: {
    target: ScriptTarget.ES2020,
  },
});

const sharedRegistryPath = (registryFilename: string): string => {
  return joinPathFragments('packages', 'shared', 'src', 'lib', registryFilename);
}

const frontendPagesRegistryPath = (): string => {
  return joinPathFragments('packages', 'fe', 'src', 'app', 'pages', 'index.ts');
}

const backendRegistryPath = (registryFilename: string): string => {
  return joinPathFragments('packages', 'be', 'src', registryFilename);
}

const getFilenameFromPath = (path: string): string => {
  const pathParts = path.split("/");
  if(!pathParts.length) {
    return '';
  }

  return pathParts[pathParts.length - 1];
}

const addRegistryEntry = (registryPath: string, registryVarName: string, entryId: string, entryValue: string, importName: string, importPath: string, tree: FsTree, isDefaultImport?: boolean) => {
  const registryFilename = getFilenameFromPath(registryPath);
  const registryFileContent = tree.read(registryPath)!.toString();

  const registrySource = project.createSourceFile(registryFilename, registryFileContent, {overwrite: true});
  const registryVar = registrySource.getVariableDeclaration(registryVarName);
  const registryObject = registryVar!.getInitializerIfKindOrThrow(
    SyntaxKind.ObjectLiteralExpression
  ) as ObjectLiteralExpression;

  if(registryObject.getProperty(`"${entryId}"`) || registryObject.getProperty(`'${entryId}'`)) {
    return;
  }

  registryObject.addPropertyAssignment({
    name: `"${entryId}"`,
    initializer: entryValue
  });

  if(isDefaultImport) {
    registrySource.addImportDeclaration({
      defaultImport: `${importName}`,
      moduleSpecifier: importPath
    });
  } else {
    registrySource.addImportDeclaration({
      defaultImport: `{${importName}}`,
      moduleSpecifier: importPath
    });
  }

  registrySource.formatText({indentSize: 2});
  tree.write(registryPath, registrySource.getText());
}

const addConstArrayItem = (registryPath: string, registryVarName: string, entryValue: string, importName: string, importPath: string, tree: FsTree) => {
  const registryFilename = getFilenameFromPath(registryPath);
  const registryFileContent = tree.read(registryPath)!.toString();

  const registrySource = project.createSourceFile(registryFilename, registryFileContent, {overwrite: true});

  const registryVar = registrySource.getVariableDeclarationOrThrow(registryVarName);
  const tuple = registryVar.getInitializerIfKindOrThrow(SyntaxKind.AsExpression) as AsExpression;

  let tupleText = '';
  if(tuple.getText() === '[]') {
    tupleText = tuple.getText().replace("]", `\n  ${entryValue}\n]`);
  } else {
    const searchVal = tuple.getText().indexOf("\n]") !== -1 ? "\n]" : "]";
    tupleText = tuple.getText().replace(searchVal, `,\n  ${entryValue}\n]`);
  }

  tuple.replaceWithText(tupleText);

  if(importName.length && importPath.length) {
    registrySource.addImportDeclaration({
      defaultImport: `{${importName}}`,
      moduleSpecifier: importPath
    });
  }

  registrySource.formatText({indentSize: 2});
  tree.write(registryPath, registrySource.getText());
}

const addArrayRegistryItem = (registryPath: string, registryVarName: string, entryValue: string, importName: string, importPath: string, tree: FsTree) => {
  const registryFilename = getFilenameFromPath(registryPath);
  const registryFileContent = tree.read(registryPath)!.toString();

  const registrySource = project.createSourceFile(registryFilename, registryFileContent, {overwrite: true});

  const typeAlias = registrySource.getTypeAliasOrThrow(registryVarName);
  const tuple = typeAlias.getTypeNodeOrThrow() as TupleTypeNode;

  let tupleText = '';
  if(tuple.getText() === '[]') {
    tupleText = tuple.getText().replace("]", `\n  ${entryValue}\n]`);
  } else {
    const searchVal = tuple.getText().indexOf("\n]") !== -1 ? "\n]" : "]";
    tupleText = tuple.getText().replace(searchVal, `,\n  ${entryValue}\n]`);
  }

  tuple.replaceWithText(tupleText);

  if(importName.length && importPath.length) {
    registrySource.addImportDeclaration({
      defaultImport: `{${importName}}`,
      moduleSpecifier: importPath
    });
  }

  registrySource.formatText({indentSize: 2});
  tree.write(registryPath, registrySource.getText());
}

const addArrayRegistryItemIfNotExists = (registryPath: string, registryVarName: string, entryValue: string,  tree: FsTree) => {
  const registryFilename = getFilenameFromPath(registryPath);
  const registryFileContent = tree.read(registryPath)!.toString();

  const registrySource = project.createSourceFile(registryFilename, registryFileContent, {overwrite: true});

  const typeAlias = registrySource.getTypeAliasOrThrow(registryVarName);
  const tuple = typeAlias.getTypeNodeOrThrow() as TupleTypeNode;

  let tupleText = tuple.getText();

  if(tupleText.indexOf(entryValue) !== -1) {
    return;
  }

  if(tupleText === '[]') {
    tupleText = tuple.getText().replace("]", `\n  ${entryValue}\n]`);
  } else {
    const searchVal = tuple.getText().indexOf("\n]") !== -1 ? "\n]" : "]";
    tupleText = tuple.getText().replace(searchVal, `,\n  ${entryValue}\n]`);
  }

  tuple.replaceWithText(tupleText);

  registrySource.formatText({indentSize: 2});
  tree.write(registryPath, registrySource.getText());
}

export const register = (node: Node, ctx: Context, tree: FsTree): boolean | CodyResponse => {
  const desc = loadDescription(node, ctx, tree);

  if(!isCodyError(desc)) {
    // Already registered
    return true;
  }

  let registryPath: string, registryVarName: string, entryId: string, entryValue: string, importName: string, importPath: string;

  const service = detectService(node, ctx);
  if(isCodyError(service)) {
    return service;
  }

  const serviceNames = names(service);

  switch (node.getType()) {
    case NodeType.command:
      const commandNames = names(nodeNameToPascalCase(node));

      registryPath = sharedRegistryPath('commands.ts');
      registryVarName = 'commands';
      entryId = `${serviceNames.className}.${commandNames.className}`;
      entryValue = importName = `${serviceNames.className}${commandNames.className}RuntimeInfo`;
      importPath = `@app/shared/commands/${serviceNames.fileName}/${commandNames.fileName}`;
      break;
    case NodeType.aggregate:
      const aggregateState = findAggregateState(node, ctx);
      if(isCodyError(aggregateState)) {
        return aggregateState;
      }

      const arNames = names(nodeNameToPascalCase(aggregateState));

      registryPath = sharedRegistryPath('aggregates.ts');
      registryVarName = 'aggregates';
      entryId = `${serviceNames.className}.${arNames.className}`;
      entryValue = importName = `${serviceNames.className}${arNames.className}AggregateDesc`;
      importPath = `@app/shared/aggregates/${serviceNames.fileName}/${arNames.fileName}.desc`;
      break;
    case NodeType.event:
      const eventNames = names(node.getName());
      const evtAggregateState = findAggregateState(node, ctx);
      if(isCodyError(evtAggregateState)) {
        return evtAggregateState;
      }
      const evtArNames = names(evtAggregateState.getName());

      registryPath = sharedRegistryPath('events.ts');
      registryVarName = 'events';
      entryId = `${serviceNames.className}.${evtArNames.className}.${eventNames.className}`;
      entryValue = importName = `${serviceNames.className}${evtArNames.className}${eventNames.className}RuntimeInfo`;
      importPath = `@app/shared/events/${serviceNames.fileName}/${evtArNames.fileName}/${eventNames.fileName}`;
      break;
    case NodeType.document:
      const voNames = names(node.getName());
      const voMeta = getVoMetadata(node, ctx);

      if(isCodyError(voMeta)) {
        return voMeta;
      }

      const nsJSONPointer = namespaceToJSONPointer(voMeta.ns);
      const nsClassName = namespaceToClassName(voMeta.ns);
      const nsFilename = namespaceToFilePath(voMeta.ns);

      registryPath = sharedRegistryPath('types.ts');
      registryVarName = 'types';
      entryId = `${serviceNames.className}${nsJSONPointer}${voNames.className}`;
      entryValue = importName = `${serviceNames.className}${nsClassName}${voNames.className}VORuntimeInfo`;
      importPath = `@app/shared/types/${serviceNames.fileName}${nsFilename}${voNames.fileName}`;
      break;
    case NodeType.ui:
      const uiNames = names(node.getName());

      registryPath = frontendPagesRegistryPath();
      registryVarName = 'pages';
      entryId = `${serviceNames.className}.${uiNames.className}`;
      entryValue = `${serviceNames.className}${uiNames.className}`;
      importName = `${uiNames.className} as ${serviceNames.className}${uiNames.className}`;
      importPath = `@frontend/app/pages/${serviceNames.fileName}/${uiNames.fileName}`;
      break;
    case NodeType.role:
      registryPath = sharedRegistryPath('types/core/user/user-role.ts');
      registryVarName = 'UserRoles';
      entryId = '';
      entryValue = `'${node.getName()}'`;
      importName = '';
      importPath = '';
      break;
    default:
      return {
        cody: `I cannot register an element of type "${node.getType()}". I don't maintain a registry for those types`,
        type: CodyResponseType.Error,
        details: `Please contact the prooph board team. This seems to be a bug in the system.`
      }
  }

  if(entryId.length === 0) {
    addConstArrayItem(registryPath, registryVarName, entryValue, importName, importPath, tree);
    return true;
  }

  addRegistryEntry(registryPath, registryVarName, entryId, entryValue, importName, importPath, tree);
  return true;
}

export const registerPolicy = (service: string, policy: Node, ctx: Context, tree: FsTree): boolean | CodyResponse => {
  const events = getSourcesOfType(policy, NodeType.event, true);

  if(isCodyError(events)) {
    return events;
  }

  if(events.count() === 0) {
    return true;
  }

  const policyName = `${names(service).className}.${names(policy.getName()).className}`;

  const registryPath = ctx.beSrc + '/policies/index.ts'

  const registryFileContent = tree.read(registryPath)!.toString();
  const registrySource = project.createSourceFile('index.ts', registryFileContent, {overwrite: true});

  for (const event of events) {
    const result = registerPolicyForEvent(service, policyName, policy, event, ctx, registrySource);

    if(isCodyError(result)) {
      return result;
    }
  }

  const policyNames = names(policy.getName());
  const  serviceNames = names(service);

  if(!registrySource.getImportDeclaration(dec => dec.getModuleSpecifier().getLiteralValue() === `@server/policies/${serviceNames.fileName}/${policyNames.fileName}`)) {

    registrySource.addImportDeclaration({
      defaultImport: `{${policyNames.propertyName} as ${serviceNames.propertyName}${policyNames.className}}`,
      moduleSpecifier: `@server/policies/${serviceNames.fileName}/${policyNames.fileName}`
    });

    registrySource.addImportDeclaration({
      defaultImport: `{${serviceNames.className}${policyNames.className}PolicyDesc}`,
      moduleSpecifier: `@server/policies/${serviceNames.fileName}/${policyNames.fileName}.desc`
    });
  }

  registrySource.formatText({indentSize: 2});
  tree.write(registryPath, registrySource.getText());

  return true;
}

const registerPolicyForEvent = (service: string, policyFQCN: string, policy: Node, event: Node, ctx: Context, registrySource: SourceFile): boolean | CodyResponse => {
  const syncedEvent = getNodeFromSyncedNodes(event, ctx.syncedNodes);

  if(isCodyError(syncedEvent)) {
    return syncedEvent;
  }

  const originalEvent = getOriginalEvent(syncedEvent, ctx);
  const eventMeta = getEventMetadata(originalEvent, ctx);
  const policyNames = names(policy.getName());
  const serviceNames = names(service);

  if(isCodyError(eventMeta)) {
    return eventMeta;
  }

  const registryVar = registrySource.getVariableDeclaration('policies');
  const registryObject = registryVar!.getInitializerIfKindOrThrow(
    SyntaxKind.ObjectLiteralExpression
  ) as ObjectLiteralExpression;

  if(!registryObject.getProperty(`'${eventMeta.fqcn}'`)) {
    registryObject.addPropertyAssignment({
      name: `'${eventMeta.fqcn}'`,
      initializer: `{}`
    });
  }

  const eventPolicesObject = registryObject.getProperty(`'${eventMeta.fqcn}'`) as PropertyAssignment;
  const eventPoliciesInitializer = eventPolicesObject.getInitializerIfKindOrThrow(
    SyntaxKind.ObjectLiteralExpression
  ) as ObjectLiteralExpression;

  if(!eventPoliciesInitializer.getProperty(`'${policyFQCN}'`)) {
    eventPoliciesInitializer.addPropertyAssignment({
      name: `'${policyFQCN}'`,
      initializer: `{ policy: ${serviceNames.propertyName}${policyNames.className}, desc: ${serviceNames.className}${policyNames.className}PolicyDesc }`
    })
  }

  return true;
}

export const registerCommandHandler = (service: string, aggregate: Node, ctx: Context, tree: FsTree): boolean | CodyResponse => {
  const serviceNames = names(service);
  const command = getSingleSource(aggregate, NodeType.command);
  const aggregateState = findAggregateState(aggregate, ctx);

  if(isCodyError(command)) {
    return command;
  }

  if(isCodyError(aggregateState)) {
    return aggregateState;
  }

  const commandNames = names(command.getName());
  const aggregateNames = names(aggregateState.getName());

  if(!isNewFile(
    joinPathFragments('packages', 'be', 'src', 'command-handlers', serviceNames.fileName, aggregateNames.fileName, `handle-${commandNames.fileName}.ts`),
    tree
    )
  ) {
    return true;
  }

  const registryPath = joinPathFragments('packages', 'be', 'src', 'command-handlers', 'index.ts');
  const registryVarName = 'commandHandlers';
  const entryId = `${serviceNames.className}.${commandNames.className}`;
  const entryValue = `handle${serviceNames.className}${commandNames.className}`;
  const importName = `handle${commandNames.className} as handle${serviceNames.className}${commandNames.className}`;
  const importPath = `@server/command-handlers/${serviceNames.fileName}/${aggregateNames.fileName}/handle-${commandNames.fileName}`;


  addRegistryEntry(registryPath, registryVarName, entryId, entryValue, importName, importPath, tree);

  return true;
}

export const registerAggregateRepository = (service: string, aggregate: Node, ctx: Context, tree: FsTree): boolean | CodyResponse => {
  const aggregateState = findAggregateState(aggregate, ctx);

  if(isCodyError(aggregateState)) {
    return aggregateState;
  }

  const serviceNames = names(service);
  const aggregateNames = names(aggregateState.getName());

  if(!isNewFile(
    joinPathFragments('packages', 'be', 'src', 'repositories', serviceNames.fileName, aggregateNames.fileName, `repository.ts`),
    tree
  )
  ) {
    return true;
  }

  const registryPath = joinPathFragments('packages', 'be', 'src', 'repositories', 'index.ts');
  const registryVarName = 'repositories';
  const entryId = `${serviceNames.className}.${aggregateNames.className}`;
  const entryValue = `${serviceNames.propertyName}${aggregateNames.className}`;
  const importName = `${serviceNames.propertyName}${aggregateNames.className}`;
  const importPath = `@server/repositories/${serviceNames.fileName}/${aggregateNames.fileName}/repository`;


  addRegistryEntry(registryPath, registryVarName, entryId, entryValue, importName, importPath, tree, true);

  return true;
}

export const registerCommandComponent = (service: string, command: Node, ctx: Context, tree: FsTree): boolean | CodyResponse => {
  const serviceNames = names(service);
  const commandNames = names(command.getName());

  if(!isNewFile(
    joinPathFragments('packages', 'fe', 'src', 'app', 'components', serviceNames.fileName, 'commands', `${commandNames.className}.tsx`),
    tree
  )
  ) {
    return true;
  }

  const registryPath = joinPathFragments('packages', 'fe', 'src', 'app', 'components', 'commands.ts');
  const registryVarName = 'commands';
  const entryId = `${serviceNames.className}.${commandNames.className}`;
  const entryValue = `${serviceNames.className}${commandNames.className}`;
  const importName = `${serviceNames.className}${commandNames.className}`;
  const importPath = `@frontend/app/components/${serviceNames.fileName}/commands/${commandNames.className}`;


  addRegistryEntry(registryPath, registryVarName, entryId, entryValue, importName, importPath, tree, true);

  return true;
}

export const registerViewComponent = (service: string, vo: Node, ctx: Context, tree: FsTree): boolean | CodyResponse => {
  const serviceNames = names(service);
  const voNames = names(vo.getName());

  if(!isNewFile(
    joinPathFragments('packages', 'fe', 'src', 'app', 'components', serviceNames.fileName, 'views', `${voNames.className}.tsx`),
    tree
  )
  ) {
    return true;
  }

  const registryPath = joinPathFragments('packages', 'fe', 'src', 'app', 'components', 'views.ts');
  const registryVarName = 'views';
  const entryId = `${serviceNames.className}.${voNames.className}`;
  const entryValue = `${serviceNames.className}${voNames.className}`;
  const importName = `${serviceNames.className}${voNames.className}`;
  const importPath = `@frontend/app/components/${serviceNames.fileName}/views/${voNames.className}`;


  addRegistryEntry(registryPath, registryVarName, entryId, entryValue, importName, importPath, tree, true);

  return true;
}

export const registerEventReducer = (service: string, event: Node, aggregateState: Node, ctx: Context, tree: FsTree): boolean | CodyResponse => {
  const serviceNames = names(service);
  const eventNames = names(event.getName());
  const aggregateNames = names(aggregateState.getName());

  if(!isNewFile(
    joinPathFragments(ctx.beSrc, 'event-reducers', serviceNames.fileName, aggregateNames.fileName, `apply-${eventNames.fileName}.ts`),
    tree
  )
  ) {
    return true;
  }

  const registryPath = joinPathFragments(ctx.beSrc, 'event-reducers', serviceNames.fileName, aggregateNames.fileName, 'index.ts');
  const registryVarName = 'reducers';
  const entryId = `${serviceNames.className}.${aggregateNames.className}.${eventNames.className}`;
  const entryValue = `apply${eventNames.className}`;
  const importName = `apply${eventNames.className}`;
  const importPath = `@server/event-reducers/${serviceNames.fileName}/${aggregateNames.fileName}/apply-${eventNames.fileName}`;


  addRegistryEntry(registryPath, registryVarName, entryId, entryValue, importName, importPath, tree);

  return true;
}

export const registerValueObjectDefinition = (service: string, vo: Node, voMeta: ValueObjectMetadata, ctx: Context, tree: FsTree): boolean | CodyResponse => {
  const serviceNames = names(service);
  const voNames = names(vo.getName());

  const nsClassName = namespaceToClassName(voMeta.ns);
  const nsFilename = namespaceToFilePath(voMeta.ns);

  if(!isNewFile(joinPathFragments(ctx.sharedSrc, 'types', serviceNames.fileName, nsFilename.slice(1, -1), voNames.fileName + '.ts'), tree)) {
    // already registered
    return true;
  }

  // Register Definition

  const registryPath = joinPathFragments(ctx.sharedSrc, 'types', 'definitions.ts');
  const registryVarName = 'definitions';
  const entryId = `/definitions/${serviceNames.fileName}${nsFilename}${voNames.fileName}`;
  const entryValue = `${serviceNames.className}${nsClassName}${voNames.className}Schema`;
  const importName = `${voNames.className}Schema as ${serviceNames.className}${nsClassName}${voNames.className}Schema`;
  const importPath = `@app/shared/types/${serviceNames.fileName}${nsFilename}${voNames.fileName}.schema`;

  addRegistryEntry(registryPath, registryVarName, entryId, entryValue, importName, importPath, tree);

  // Register Reference
  const refPath = joinPathFragments(ctx.sharedSrc, 'types', 'references.ts');
  const refVarName = 'references';
  const refEntryValue = `typeof ${serviceNames.className}${nsClassName}${voNames.className}Schema`;
  const refImportName = `${voNames.className}Schema as ${serviceNames.className}${nsClassName}${voNames.className}Schema`;
  const refImportPath = `@app/shared/types/${serviceNames.fileName}${nsFilename}${voNames.fileName}.schema`;

  addArrayRegistryItem(refPath, refVarName, refEntryValue, refImportName, refImportPath, tree);

  const schema = voMeta.schema;

  if(isObjectSchema(schema)) {
    const properties = schema.properties || {};

    Object.keys(properties).forEach(prop => {
      addArrayRegistryItemIfNotExists(refPath, refVarName, `${refEntryValue}.properties.${prop}`, tree);
    })
  }

  return true;
}

export const registerQuery = (service: string, vo: Node, voMeta: ValueObjectMetadata, ctx: Context, tree: FsTree): boolean | CodyResponse => {
  const serviceNames = names(service);
  const queryNames = names('Get ' + vo.getName());

  if(!isNewFile(
    joinPathFragments(ctx.sharedSrc, 'queries', serviceNames.fileName, `${queryNames.fileName}.ts`),
    tree
  )
  ) {
    return true;
  }

  let importName;
  const registryPath = joinPathFragments(ctx.sharedSrc, 'queries.ts');
  const registryVarName = 'queries';
  const entryId = `${serviceNames.className}.${queryNames.className}`;
  const entryValue = importName = `${serviceNames.className}${queryNames.className}QueryRuntimeInfo`;
  const importPath = `@app/shared/queries/${serviceNames.fileName}/${queryNames.fileName}`;


  addRegistryEntry(registryPath, registryVarName, entryId, entryValue, importName, importPath, tree);

  return true;
}

export const registerQueryResolver = (service: string, vo: Node, ctx: Context, tree: FsTree): boolean | CodyResponse => {
  const serviceNames = names(service);
  const queryNames = names('Get ' + vo.getName());

  if(!isNewFile(
    joinPathFragments(ctx.beSrc, 'query-resolvers', serviceNames.fileName, `resolve-${queryNames.fileName}.ts`),
    tree
  )
  ) {
    return true;
  }

  const registryPath = joinPathFragments(ctx.beSrc, 'query-resolvers', 'index.ts');
  const registryVarName = 'queryResolvers';
  const entryId = `${serviceNames.className}.${queryNames.className}`;
  const entryValue = `resolve${serviceNames.className}${queryNames.className}`;
  const importName = `resolve${queryNames.className} as resolve${serviceNames.className}${queryNames.className}`;
  const importPath = `@server/query-resolvers/${serviceNames.fileName}/resolve-${queryNames.fileName}`;


  addRegistryEntry(registryPath, registryVarName, entryId, entryValue, importName, importPath, tree);

  return true;
}
