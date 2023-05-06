import {CodyHook, Node} from "@proophboard/cody-types";
import {Context} from "./context";
import {JSONSchema} from "json-schema-to-ts";
import {ShorthandObject} from "@proophboard/schema-to-typescript/lib/jsonschema";
import {names} from "@event-engine/messaging/helpers";
import {flushChanges, FsTree} from "nx/src/generators/tree";
import {generateFiles} from "@nx/devkit";
import * as fs from "fs";

interface CommandMeta {
  newAggregate: boolean;
  shorthand: boolean;
  schema: JSONSchema | ShorthandObject;
  service?: string;
}

export const onCommand: CodyHook<Context> = async (command: Node, ctx: Context) => {
  const cmdNames = names(command.getName());

  const tree = new FsTree(ctx.projectRoot, true);

  generateFiles(tree, __dirname + '/command-files/shared', ctx.sharedSrc, {
    'tmpl': '',
    'service': 'fleet-management',
    ...cmdNames
  })

  const changes = tree.listChanges();

  flushChanges(ctx.projectRoot, changes);

  return {
    cody: "Yeah! Command hook is invoked",
    details: tree.listChanges().map(change => `${change.type} ${change.path}`).join("\n"),
  }
}
