import {CodyResponse, Node} from "@proophboard/cody-types";
import {Context} from "../../context";
import {FsTree} from "nx/src/generators/tree";
import {detectService} from "../detect-service";
import {isCodyError} from "@proophboard/cody-utils";
import {names} from "@event-engine/messaging/helpers";
import {generateFiles} from "@nx/devkit";
import {registerCommandComponent} from "../registry";

export const upsertCommandComponent = async (command: Node, ctx: Context, tree: FsTree): Promise<boolean|CodyResponse> => {
  const service = detectService(command, ctx);

  if(isCodyError(service)) {
    return service;
  }

  const serviceNames = names(service);
  const commandNames = names(command.getName());

  generateFiles(tree, __dirname + '/../../ui-files/command-files', ctx.feSrc, {
    tmpl: '',
    service: serviceNames.fileName,
    serviceNames,
    ...commandNames
  });

  return registerCommandComponent(service, command, ctx, tree);
}
