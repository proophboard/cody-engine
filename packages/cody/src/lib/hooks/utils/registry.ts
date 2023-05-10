import {CodyResponse, CodyResponseType, Node, NodeType} from "@proophboard/cody-types";
import {Context} from "../context";
import {FsTree} from "nx/src/generators/tree";
import {loadDescription} from "./prooph-board-info";
import {isCodyError, nodeNameToPascalCase} from "@proophboard/cody-utils";
import {ObjectLiteralExpression, Project, ScriptTarget, SyntaxKind} from "ts-morph";
import {joinPathFragments} from "nx/src/utils/path";
import {detectService} from "./detect-service";
import {names} from "@event-engine/messaging/helpers";

const project = new Project({
  compilerOptions: {
    target: ScriptTarget.ES2020,
  },
});

const addRegistryEntry = (registryFilename: string, registryVarName: string, entryId: string, entryValue: string, importPath: string, tree: FsTree) => {
  const registryPath = joinPathFragments('packages', 'shared', 'src', 'lib', registryFilename);
  const registryFileContent = tree.read(registryPath)!.toString();

  const registrySource = project.createSourceFile(registryFilename, registryFileContent);
  const registryVar = registrySource.getVariableDeclaration(registryVarName);
  const registryObject = registryVar!.getInitializerIfKindOrThrow(
    SyntaxKind.ObjectLiteralExpression
  ) as ObjectLiteralExpression;

  if(registryObject.getProperty(entryId)) {
    return;
  }

  registryObject.addPropertyAssignment({
    name: `"${entryId}"`,
    initializer: entryValue
  });

  registrySource.addImportDeclaration({
    defaultImport: `{${entryValue}}`,
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

  let registryFilename: string, registryVarName: string, entryId: string, entryValue: string, importPath: string;

  const service = detectService(node, ctx);
  if(isCodyError(service)) {
    return service;
  }

  const serviceNames = names(service);

  switch (node.getType()) {
    case NodeType.command:
      const commandNames = names(nodeNameToPascalCase(node));

      registryFilename = 'commands.ts';
      registryVarName = 'commands';
      entryId = `${serviceNames.className}.${commandNames.className}`;
      entryValue = `${serviceNames.className}${commandNames.className}RuntimeInfo`;
      importPath = `@app/shared/commands/${serviceNames.fileName}/${commandNames.fileName}`;
      break;
    case NodeType.aggregate:
      const arNames = names(nodeNameToPascalCase(node));

      registryFilename = 'aggregates.ts';
      registryVarName = 'aggregates';
      entryId = `${serviceNames.className}.${arNames.className}`;
      entryValue = `${serviceNames.className}${arNames.className}Desc`;
      importPath = `@app/shared/aggregates/${serviceNames.fileName}/${arNames.fileName}.desc`;
      break;
    default:
      return {
        cody: `I cannot register an element of type "${node.getType()}". I don't maintain a registry for those types`,
        type: CodyResponseType.Error,
        details: `Please contact the prooph board team. This seems to be a bug in the system.`
      }
  }

  addRegistryEntry(registryFilename, registryVarName, entryId, entryValue, importPath, tree);
  return true;
}
