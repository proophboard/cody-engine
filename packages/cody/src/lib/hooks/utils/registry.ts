import {CodyResponse, CodyResponseType, Node, NodeType} from "@proophboard/cody-types";
import {Context} from "../context";
import {FsTree} from "nx/src/generators/tree";
import {loadDescription} from "./prooph-board-info";
import {getSingleSource, isCodyError, nodeNameToPascalCase} from "@proophboard/cody-utils";
import {ObjectLiteralExpression, Project, ScriptTarget, SyntaxKind} from "ts-morph";
import {joinPathFragments} from "nx/src/utils/path";
import {detectService} from "./detect-service";
import {names} from "@event-engine/messaging/helpers";
import {isNewFile} from "./fs-tree";

const project = new Project({
  compilerOptions: {
    target: ScriptTarget.ES2020,
  },
});

const sharedRegistryPath = (registryFilename: string): string => {
  return joinPathFragments('packages', 'shared', 'src', 'lib', registryFilename);
}

const getFilenameFromPath = (path: string): string => {
  const pathParts = path.split("/");
  if(!pathParts.length) {
    return '';
  }

  return pathParts[pathParts.length - 1];
}

const addRegistryEntry = (registryPath: string, registryVarName: string, entryId: string, entryValue: string, importName: string, importPath: string, tree: FsTree) => {
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
