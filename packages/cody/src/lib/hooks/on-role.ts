import {CodyHook, CodyResponse, Node} from "@proophboard/cody-types";
import {Context} from "./context";
import {CodyResponseException, withErrorCheck} from "./utils/error-handling";
import {names} from "@event-engine/messaging/helpers";
import {listChangesForCodyResponse, requireUncached} from "./utils/fs-tree";
import {flushChanges, FsTree} from "nx/src/generators/tree";
import {register} from "./utils/registry";
import {formatFiles} from "@nx/devkit";
import {UserRoles} from "@app/shared/types/core/user/user-role";

export const onRole: CodyHook<Context> = async (role: Node, ctx: Context): Promise<CodyResponse> => {
  try {
    const roleNames = names(role.getName());

    const {UserRoles} = requireUncached('@app/shared/types/core/user/user-role');

    const {tree} = ctx;

    if(!UserRoles.includes(roleNames.className)) {
      withErrorCheck(register, [role, ctx, tree]);
    }

    await formatFiles(tree);

    const changes = tree.listChanges();

    flushChanges(ctx.projectRoot, changes);

    return {
      cody: `The role "${role.getName()}" can now be assigned to users.`,
      details: listChangesForCodyResponse(tree)
    }
  } catch (e) {
    if(e instanceof CodyResponseException) {
      return e.codyResponse;
    }

    throw e;
  }
}
