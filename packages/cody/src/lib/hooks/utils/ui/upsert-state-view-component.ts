import {CodyResponse, Node} from "@proophboard/cody-types";
import {ValueObjectMetadata} from "../value-object/get-vo-metadata";
import {Context} from "../../context";
import {FsTree} from "nx/src/generators/tree";
import {namespaceToClassName, namespaceToFilePath} from "../value-object/namespace";
import {detectService} from "../detect-service";
import {isCodyError} from "@proophboard/cody-utils";
import {names} from "@event-engine/messaging/helpers";
import {generateFiles} from "@nx/devkit";
import {registerViewComponent} from "../registry";

export const upsertStateViewComponent = async (vo: Node, voMeta: ValueObjectMetadata, ctx: Context, tree: FsTree): Promise<boolean|CodyResponse> => {
  const service = detectService(vo, ctx);

  if (isCodyError(service)) {
    return service;
  }

  const serviceNames = names(service);
  const voNames = names(vo.getName());
  const nsClassName = namespaceToClassName(voMeta.ns);
  const nsFilename = namespaceToFilePath(voMeta.ns);
  const identifier = voMeta.identifier;

  generateFiles(tree, __dirname + '/../../ui-files/state-view-files', ctx.feSrc, {
    tmpl: '',
    service: serviceNames.fileName,
    serviceNames,
    identifier,
    nsClassName,
    nsFilename,
    ...voNames
  });

  registerViewComponent(service, vo, ctx, tree);

  return true;
}
