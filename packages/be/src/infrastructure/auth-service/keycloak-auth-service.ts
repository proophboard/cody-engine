import {
  AuthService,
  AuthUser,
  convertFindByFilter,
  FindByArguments,
  UnregisteredUser,
  UserId
} from '@event-engine/infrastructure/auth-service/auth-service';
import { User } from '@app/shared/types/core/user/user';
import { Filter } from '@event-engine/infrastructure/DocumentStore/Filter';
import { SortOrder } from '@event-engine/infrastructure/DocumentStore';
import {ParsedToken, parsedTokenToUser} from "@app/shared/utils/keycloak/parsed-token-to-user";
import {KeycloakAdminClient, UserRepresentation} from "@s3pweb/keycloak-admin-client-cjs";
import {UserRole, UserRoles} from "@app/shared/types/core/user/user-role";
import {AndFilter} from "@event-engine/infrastructure/DocumentStore/Filter/AndFilter";
import {EqFilter} from "@event-engine/infrastructure/DocumentStore/Filter/EqFilter";
import {InArrayFilter} from "@event-engine/infrastructure/DocumentStore/Filter/InArrayFilter";

export interface AdminCredentials {
  username: string;
  password: string;
  clientId: string;
}

export class KeycloakAuthService implements AuthService {

  private currentUser: User | undefined;
  private adminClient: KeycloakAdminClient;
  private adminCredentials: AdminCredentials;
  private realm: string;
  private useAttributeRoles: boolean;

  public constructor(adminClient: KeycloakAdminClient, credentials: AdminCredentials, realm: string, useAttributeRoles?: boolean) {
    this.adminClient = adminClient;
    this.adminCredentials = credentials;
    this.realm = realm;
    this.useAttributeRoles = !!useAttributeRoles;
  }

  public async update(user: AuthUser): Promise<void> {
    await this.authenticateAsAdmin();

    const isEnabled: boolean = user.attributes ? user.attributes['enabled'] === true : false;

    const attributes = {...user.attributes};

    delete attributes['enabled'];

    let realmRoles: string[] | undefined = undefined;

    if(this.useAttributeRoles) {
      attributes.roles = user.roles;
    } else {
      realmRoles = user.roles;
    }

    return this.adminClient.users.update(
      {
        id: user.userId,
        realm: this.realm
      },
      {
        email: user.email,
        firstName: user.displayName,
        attributes,
        realmRoles,
        enabled: isEnabled,
      }
    )
  }

  async register(user: UnregisteredUser): Promise<string> {
    await this.authenticateAsAdmin();

    const isEnabled: boolean = user.attributes ? user.attributes['enabled'] === true : false;

    const attributes = {...user.attributes};

    delete attributes['enabled'];

    let realmRoles: string[] | undefined = undefined;

    if(this.useAttributeRoles) {
      attributes.roles = user.roles;
    } else {
      realmRoles = user.roles;
    }

    const { id }  = await this.adminClient.users.create({
      username: user.email,
      email: user.email,
      firstName: user.displayName,
      attributes,
      realmRoles,
      enabled: isEnabled,
      requiredActions: ['UPDATE_PASSWORD', 'VERIFY_EMAIL'],
      realm: this.realm
    });

    await this.adminClient.users.executeActionsEmail({
      id: id,
      actions: ['VERIFY_EMAIL', 'UPDATE_PASSWORD'],
      realm: this.realm,
    });

    return id;
  }

  public async resetPasswordEmail(userId: UserId|string): Promise<void> {
    const stringUserId = typeof userId === "string" ? userId : userId.userId;

    await this.authenticateAsAdmin();

    await this.adminClient.users.executeActionsEmail({
      id: stringUserId,
      actions: ['UPDATE_PASSWORD'],
      realm: this.realm,
    });
  }

  async tokenToUser(parsedToken: unknown): Promise<User> {
    this.currentUser = parsedTokenToUser(parsedToken as ParsedToken, this.useAttributeRoles);
    return this.currentUser;
  }

  async get(userId: string): Promise<User> {
    if(this.currentUser?.userId === userId) {
      return this.currentUser;
    }

    await this.authenticateAsAdmin();

    const userData = await this.adminClient.users.findOne({id: userId, realm: this.realm});

    if(!userData) {
      return {
        userId,
        email: 'unknown@anonymous.local',
        displayName: 'Unknown',
        roles: []
      }
    }

    return this.mapKeycloakUserToUser(userData);
  }

  async find(filter: Filter, skip?: number, limit?: number, orderBy?: SortOrder): Promise<User[]> {

    if(orderBy) {
      throw new Error(`KeycloakAuthService.find with orderBy is not supported yet! Please use the find method without orderBy`);
    }

    if(filter instanceof EqFilter && filter.prop === "userId") {
      return [await this.get(filter.val)];
    }

    await this.authenticateAsAdmin();

    try {
      const usersData = await this.adminClient.users.find({
        ...this.convertFilterToUserQuery(filter),
        realm: this.realm,
        first: skip,
        max: limit
      });

      return usersData.map(d => this.mapKeycloakUserToUser(d));
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  public async findOneBy(by: FindByArguments): Promise<User|undefined> {
    by.limit = 1;

    const result = await this.findBy(by);

    if(!result.length) {
      return undefined;
    }

    return result[0];
  }

  public async findBy(by: FindByArguments): Promise<User[]> {
    return this.find(convertFindByFilter(by.filter), by.skip, by.limit, by.orderBy);
  }

  private async authenticateAsAdmin () {
    try {
      return this.adminClient.auth({grantType: "password", ...this.adminCredentials});
    }catch (e) {
      console.error(e);
      throw e;
    }
  }

  private mapKeycloakUserToUser(user: UserRepresentation & {avatar?: string}): User {

    let displayName = user.firstName || '';

    if(user.lastName) {
      displayName = user.firstName ? ' ' + user.lastName : user.lastName;
    }

    const attributes = user.attributes || {};
    let roles: UserRole[] = [];

    if(this.useAttributeRoles && attributes.roles && Array.isArray(attributes.roles)) {
      roles = attributes.roles.filter(r => UserRoles.includes(r));
      delete attributes.roles;
    }

    for (const attribute in attributes) {
      if(Array.isArray(attributes[attribute]) && attributes[attribute].length === 1) {
        attributes[attribute] = attributes[attribute][0];
      }
    }

    attributes['enabled'] = user.enabled;

    return {
      userId: user.id || '',
      email: user.email || '',
      displayName,
      roles,
      attributes,
      avatar: user.avatar,
    }
  }

  private convertFilterToUserQuery (filter: Filter): {q: string} {
    let q = '';
    if(filter instanceof AndFilter) {
      q = filter.internalFilters.map(f => this.convertFilterToUserQuery(f).q).join(" ");

      return {q};
    }

    if(filter instanceof InArrayFilter && filter.prop === 'roles') {
      if(!this.useAttributeRoles) {
        throw new Error(`A KeycloakAuthService.find with a "roles" filter can only be used when the flag "keycloak.useAttributeRoles" is set to true in the environment config.`);
      }

      q = `roles:${filter.val}`

      return {q};
    }

    if(filter instanceof EqFilter && filter.prop.search('attributes.') === 0) {
      const attr = filter.prop.replace('attributes.', '');

      q = `${attr}:${filter.val}`;

      return {q};
    }

    throw new Error(`Unsupported filter passed to KeycloakAuthService.find: ${JSON.stringify(filter)}.\nOnly roles and attributes filters combined with a logical AND are supported by Keycloak`);
  }
}
