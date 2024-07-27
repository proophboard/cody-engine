import {AuthService, FindByArguments, UnregisteredUser} from "@server/infrastructure/auth-service/auth-service";
import {Persona} from "@app/shared/extensions/personas";
import {v4} from "uuid";
import {User} from "@app/shared/types/core/user/user";
import {SortOrder} from "@event-engine/infrastructure/DocumentStore";
import {areValuesEqualForAllSorts, getValueFromPath} from "@event-engine/infrastructure/DocumentStore/helpers";
import {FilterProcessor} from "@event-engine/infrastructure/DocumentStore/FilterProcessor";
import {InMemoryFilterProcessor} from "@event-engine/infrastructure/DocumentStore/InMemory/InMemoryFilterProcessor";
import {makeFilter} from "@cody-play/queries/make-filters";
import {Filter} from "@event-engine/infrastructure/DocumentStore/Filter";
import {EqFilter} from "@event-engine/infrastructure/DocumentStore/Filter/EqFilter";
import {InArrayFilter} from "@event-engine/infrastructure/DocumentStore/Filter/InArrayFilter";

export type OnPersonaAdded = (newPersona: Persona) => void;

export class PlayAuthService implements AuthService {
  private readonly personas: Persona[];
  private readonly onPersonaAdded: OnPersonaAdded;
  private filterProcessor: FilterProcessor;

  public constructor(personas: Persona[], onPersonaAdded: OnPersonaAdded) {
    this.personas = personas;
    this.onPersonaAdded = onPersonaAdded;
    this.filterProcessor = new InMemoryFilterProcessor();
  }

  public async register(user: UnregisteredUser): Promise<string> {
    if(this.personas.map(p => p.email).includes(user.email)) {
      throw new Error(`A persona with email address ${user.email} does already exist.`);
    }
    const userId = v4();

    const newPersona: Persona = {
      userId,
      ...user,
      description: `This persona is auto generated from a user registered via AuthService.\n\nRole${user.roles.length > 1? 's' : ''}: ${user.roles.join(', ')}`,
      color: '#'+Math.floor(Math.random()*16777215).toString(16)
    };

    this.personas.push(newPersona);
    this.onPersonaAdded(newPersona);

    return userId;
  }

  public async get(userId: string): Promise<User> {
    const matchingPersonas = this.personas.filter(p => p.userId === userId);

    if(matchingPersonas.length) {
      return matchingPersonas[0];
    }

    return {
      userId,
      displayName: 'Unknown',
      email: 'unknown@anonymous.local',
      roles: []
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
    const filter = by.property === "userId"
      ? new EqFilter('userId', by.value)
      : by.property === "role"
        ? new InArrayFilter('roles', by.value)
        : new EqFilter(`attributes.${by.property}`, by.value);

    return this.find(filter, by.skip, by.limit, by.orderBy);
  }

  public async find(filter: Filter, skip?: number, limit?: number, orderBy?: SortOrder): Promise<User[]> {

    const collection: Array<[string, Persona, number]> = this.personas.map(p => [p.userId, p, 1]);

    if(orderBy) {
      const comparedSorts: SortOrder = [];
      orderBy.forEach(sort => {
        collection.sort((aResult, bResult) => {
          if(!areValuesEqualForAllSorts(comparedSorts, aResult[1], bResult[1])) {
            return 0;
          }

          const aDocVal: any = getValueFromPath(sort.prop, aResult[1]);
          const bDocVal: any = getValueFromPath(sort.prop, bResult[1]);
          const sortNumber = sort.sort === 'asc'? -1 : 1;

          if(typeof aDocVal === 'undefined' && typeof bDocVal !== 'undefined') {
            return sortNumber * -1;
          }

          if(typeof aDocVal !== 'undefined' && typeof bDocVal === 'undefined' ) {
            return sortNumber
          }

          if(typeof aDocVal === 'undefined' && typeof bDocVal === 'undefined') {
            return 0;
          }

          return aDocVal < bDocVal ? sortNumber : sortNumber * -1;
        })

        comparedSorts.push(sort);
      })
    }

    let count = 0;
    const resultSet: User[] = [];

    const filterFunction = this.filterProcessor.process(filter);

    for (const [userId, persona] of collection) {
      if(!filterFunction(persona, persona.userId)) {
        continue;
      }

      count++;
      if(skip && count <= skip) continue;
      if(limit && (count - (skip || 0)) > limit) break;

      resultSet.push(persona);
    }

    return resultSet;
  }

  public async exportPersonas(): Promise<Persona[]> {
    return this.personas;
  }
}
