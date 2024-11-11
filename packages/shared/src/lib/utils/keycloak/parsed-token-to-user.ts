import {User} from "@app/shared/types/core/user/user";
import {UserRole, UserRoles} from "@app/shared/types/core/user/user-role";

export interface ClientToken extends ParsedToken{
  client_id: string;
}

export interface UserToken extends ParsedToken {
  email: string;
  given_name: string;
  family_name: string;
  name: string;
  avatar?: string;
  attributes?: {[attr: string]: string};
}

export interface ParsedToken {
  sub: string;
  realm_access: {
    roles: string[]
  };
}

export const isClientToken = (token: ParsedToken & {client_id?: string}): token is ClientToken => {
  return typeof token.client_id !== "undefined";
}

export const isUserToken = (token: ParsedToken & {email?: string}): token is UserToken => {
  return typeof token.email !== "undefined";
}

export const parsedTokenToUser = (parsedToken: ParsedToken, useAttributeRoles?: boolean): User => {
  let roles = parsedToken.realm_access
    .roles.filter(r => UserRoles.includes(r as UserRole)) as UserRole[];

  if(isClientToken(parsedToken)) {
    return {
      userId: parsedToken.sub,
      email: 'unknown@anonymous.local',
      displayName: parsedToken.client_id,
      roles
    }
  }

  if(isUserToken(parsedToken)) {
    const attributes = {...parsedToken.attributes};


    if (useAttributeRoles) {
      let attrRoles = attributes && attributes.roles ? attributes.roles as UserRole | UserRole[] : ['Anyone'];
      if(typeof attrRoles === "string") {
        attrRoles = [attrRoles];
      }

      roles = attrRoles.filter(r => UserRoles.includes(r as UserRole)) as UserRole[];

      delete attributes.roles;
    }

    for (const attribute in attributes) {
      if(Array.isArray(attributes[attribute])) {
        attributes[attribute] = attributes[attribute][0];
      }
    }

    return {
      userId: parsedToken.sub,
      email: parsedToken.email,
      displayName: parsedToken.name,
      roles: roles,
      avatar: parsedToken.avatar,
      attributes: attributes,
    }
  }

  throw new Error(`Parsed token is neither a ClientToken nor a UserToken`);
}
