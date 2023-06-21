import {CodyResponse, CodyResponseType, Node, NodeType} from "@proophboard/cody-types";
import {Context} from "../context";
import {FsTree} from "nx/src/generators/tree";
import {loadDescription} from "./prooph-board-info";
import {getSingleSource, isCodyError, nodeNameToPascalCase} from "@proophboard/cody-utils";
import {ObjectLiteralExpression, Project, ScriptTarget, SyntaxKind, TupleTypeNode} from "ts-morph";
import {joinPathFragments} from "nx/src/utils/path";
import {detectService} from "./detect-service";
import {names} from "@event-engine/messaging/helpers";
import {isNewFile} from "./fs-tree";
import {getVoMetadata, ValueObjectMetadata} from "./value-object/get-vo-metadata";
import {namespaceToClassName, namespaceToFilePath, namespaceToJSONPointer} from "./value-object/namespace";

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

  if(registryObject.getProperty(`"${entryId}"`)) {
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
    tupleText = tuple.getText().replace("\n]", `,\n  ${entryValue}\n]`);
  }

  tuple.replaceWithText(tupleText);

  registrySource.addImportDeclaration({
    defaultImport: `{${importName}}`,
    moduleSpecifier: importPath
  });

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
      const arNames = names(nodeNameToPascalCase(node));

      registryPath = sharedRegistryPath('aggregates.ts');
      registryVarName = 'aggregates';
      entryId = `${serviceNames.className}.${arNames.className}`;
      entryValue = importName = `${serviceNames.className}${arNames.className}Desc`;
      importPath = `@app/shared/aggregates/${serviceNames.fileName}/${arNames.fileName}.desc`;
      break;
    case NodeType.event:
      const eventNames = names(node.getName());
      const evtAggregate = getSingleSource(node, NodeType.aggregate);
      if(isCodyError(evtAggregate)) {
        return evtAggregate;
      }
      const evtArNames = names(evtAggregate.getName());

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

      const nsClassName = namespaceToJSONPointer(voMeta.ns);
      const nsFilename = namespaceToFilePath(voMeta.ns);

      registryPath = sharedRegistryPath('types.ts');
      registryVarName = 'types';
      entryId = `${serviceNames.className}.${nsClassName}.${voNames.className}`;
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
    default:
      return {
        cody: `I cannot register an element of type "${node.getType()}". I don't maintain a registry for those types`,
        type: CodyResponseType.Error,
        details: `Please contact the prooph board team. This seems to be a bug in the system.`
      }
  }

  addRegistryEntry(registryPath, registryVarName, entryId, entryValue, importName, importPath, tree);
  return true;
}

export const registerCommandHandler = (service: string, aggregate: Node, ctx: Context, tree: FsTree): boolean | CodyResponse => {
  const serviceNames = names(service);
  const command = getSingleSource(aggregate, NodeType.command);
  if(isCodyError(command)) {
    return command;
  }
  const commandNames = names(command.getName());
  const aggregateNames = names(aggregate.getName());

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

export const registerEventReducer = (service: string, event: Node, aggregate: Node, ctx: Context, tree: FsTree): boolean | CodyResponse => {
  const serviceNames = names(service);
  const eventNames = names(event.getName());
  const aggregateNames = names(aggregate.getName());

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
