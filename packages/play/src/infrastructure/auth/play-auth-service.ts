import {AuthService, UnregisteredUser} from "@server/infrastructure/auth-service/auth-service";
import {Persona} from "@app/shared/extensions/personas";
import {v4} from "uuid";
import {User} from "@app/shared/types/core/user/user";

export type OnPersonaAdded = (newPersona: Persona) => void;

export class PlayAuthService implements AuthService {
  private readonly personas: Persona[];
  private readonly onPersonaAdded: OnPersonaAdded;

  public constructor(personas: Persona[], onPersonaAdded: OnPersonaAdded) {
    this.personas = personas;
    this.onPersonaAdded = onPersonaAdded;
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

  public async exportPersonas(): Promise<Persona[]> {
    return this.personas;
  }
}
