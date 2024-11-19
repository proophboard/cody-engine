import {
  AuthService, AuthUser,
  convertFindByFilter,
  FindByArguments,
  UnregisteredUser
} from "@event-engine/infrastructure/auth-service/auth-service";
import {Persona} from "@app/shared/extensions/personas";
import {v4} from "uuid";
import {User} from "@app/shared/types/core/user/user";
import {InMemoryFilterProcessor} from "@event-engine/infrastructure/DocumentStore/InMemory/InMemoryFilterProcessor";
import {FilterProcessor} from "@event-engine/infrastructure/DocumentStore/FilterProcessor";
import {Filter} from "@event-engine/infrastructure/DocumentStore/Filter";
import {SortOrder} from "@event-engine/infrastructure/DocumentStore";
import {areValuesEqualForAllSorts, getValueFromPath} from "@event-engine/infrastructure/DocumentStore/helpers";
import * as fs from "node:fs";
import {generateFiles} from "@nx/devkit";
import {renderFile} from "ejs";

export class PrototypeAuthService implements AuthService {
  private personas: Persona[];
  private personasFile: string;
  private filterProcessor: FilterProcessor;

  public constructor(personas: Persona[], personasFile: string) {
    this.personas = personas;
    this.personasFile = personasFile;
    this.filterProcessor = new InMemoryFilterProcessor();
  }

  public async update(user: AuthUser): Promise<void> {
    const personaToUpdate = this.personas.filter(p => p.userId === user.userId).pop();

    if(!personaToUpdate) {
      throw new Error(`Persona with id ${user.userId} not found.`);
    }

    const updatedPersona = {
      ...personaToUpdate,
      ...user,
    }

    this.personas = this.personas.filter(p => p.userId !== user.userId);
    this.personas.push(updatedPersona as Persona);

    await this.savePersonas();
  }

  public async register(user: UnregisteredUser): Promise<string> {
    if(this.personas.map(p => p.email).includes(user.email)) {
      throw new Error(`A persona with email address ${user.email} does already exist.`);
    }
    const userId = v4();

    const newPersona: AuthUser & {description: string, color: string} = {
      userId,
      ...user,
      description: `This persona is auto generated from a user registered via AuthService.\n\nRole${user.roles.length > 1? 's' : ''}: ${user.roles.join(', ')}`,
      color: '#'+Math.floor(Math.random()*16777215).toString(16)
    };

    this.personas.push(newPersona as Persona);

    await this.savePersonas();

    return userId;
  }

  public async tokenToUser(raw: unknown): Promise<User> {
    return raw as User;
  }

  public async get(userId: string): Promise<User> {
    const matchingPersonas = this.personas.filter(p => p.userId === userId);

    if(matchingPersonas.length) {
      const persona = matchingPersonas[0];

      return this.mapPersonaToUser(persona);
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
    return this.find(convertFindByFilter(by.filter), by.skip, by.limit, by.orderBy);
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

      resultSet.push(this.mapPersonaToUser(persona));
    }

    return resultSet;
  }

  private mapPersonaToUser(persona: Persona): User {
    return {
      userId: persona.userId,
      displayName: persona.displayName,
      roles: persona.roles,
      email: persona.email,
      avatar: persona.avatar,
      attributes: persona.attributes,
    }
  }

  private async savePersonas(): Promise<void> {
    renderFile(__dirname + '/files/personas.ts__tmpl__', {
      tmpl: '',
      toJSON: (obj: unknown): string => {
        return JSON.stringify(obj, null, 2);
      },
      personas: this.personas,
    }, (err: Error | null, content: string | null) => {
      if(err) {
        throw err;
      }

      if(content) {
        fs.writeFileSync(this.personasFile, content);
      }
    })
  }
}
