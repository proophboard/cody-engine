import {CodyResponse, Node} from "@proophboard/cody-types";
import {ValueObjectMetadata} from "@cody-engine/cody/hooks/utils/value-object/types";
import {Context} from "@cody-engine/cody/hooks/context";
import {FsTree} from "nx/src/generators/tree";
import {detectService} from "@cody-engine/cody/hooks/utils/detect-service";
import {isCodyError} from "@proophboard/cody-utils";
import {names} from "@event-engine/messaging/helpers";
import {
  namespaceNames,
  namespaceToClassName,
  namespaceToFilePath
} from "@cody-engine/cody/hooks/utils/value-object/namespace";
import {registryIdToDataReference} from "@app/shared/utils/registry-id-to-data-reference";
import {generateFiles} from "@nx/devkit";
import {registerViewComponent} from "@cody-engine/cody/hooks/utils/registry";

export const upsertStaticViewComponent = async (vo: Node, voMeta: ValueObjectMetadata, ctx: Context, tree: FsTree): Promise<boolean|CodyResponse> => {
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


  generateFiles(tree, __dirname + '/../../ui-files/static-view-files', ctx.feSrc, {
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
