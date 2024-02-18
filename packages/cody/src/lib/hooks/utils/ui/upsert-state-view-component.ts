import {CodyResponse, Node} from "@proophboard/cody-types";
import {Context} from "../../context";
import {FsTree} from "nx/src/generators/tree";
import {namespaceNames, namespaceToClassName, namespaceToFilePath} from "../value-object/namespace";
import {detectService} from "../detect-service";
import {isCodyError} from "@proophboard/cody-utils";
import {names} from "@event-engine/messaging/helpers";
import {generateFiles} from "@nx/devkit";
import {registerViewComponent} from "../registry";
import {ValueObjectMetadata} from "@cody-engine/cody/hooks/utils/value-object/types";
import {registryIdToDataReference} from "@app/shared/utils/registry-id-to-data-reference";

export const upsertStateViewComponent = async (vo: Node, voMeta: ValueObjectMetadata, ctx: Context, tree: FsTree): Promise<boolean|CodyResponse> => {
  const service = detectService(vo, ctx);

  if (isCodyError(service)) {
    return service;
  }

  const serviceNames = names(service);
  const voNames = names(vo.getName());
  const nsClassName = namespaceToClassName(voMeta.ns);
  const nsFilename = namespaceToFilePath(voMeta.ns);
  const ns = namespaceNames(voMeta.ns);
  const identifier = voMeta.identifier;
  const voRegistryId = `${serviceNames.className}${ns.JSONPointer}${voNames.className}`;
  const dataReference = registryIdToDataReference(voRegistryId);


  generateFiles(tree, __dirname + '/../../ui-files/state-view-files', ctx.feSrc, {
    tmpl: '',
    service: serviceNames.fileName,
    serviceNames,
    identifier,
    nsClassName,
    nsFilename,
    dataReference,
    ...voNames
  });

  registerViewComponent(service, vo, ctx, tree);

  return true;
}
