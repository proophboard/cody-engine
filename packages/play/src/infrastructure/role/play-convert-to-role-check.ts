import {List} from "immutable";
import {Node} from "@proophboard/cody-types";

export const playConvertToRoleCheck = (roles: List<Node>): string => {
  let check = '';
  let firstCheck = true;

  roles.forEach(role => {
    const roleCheck = `!isRole(user, '${role.getName()}')`;
    check += firstCheck ? roleCheck : ' && ' + roleCheck;
    firstCheck = false;
  })

  return check;
}
