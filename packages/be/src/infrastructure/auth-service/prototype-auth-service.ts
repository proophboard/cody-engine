import {AuthService, UnregisteredUser} from "@server/infrastructure/auth-service/auth-service";
import {Persona} from "@app/shared/extensions/personas";
import {v4} from "uuid";
import {flushChanges, FsTree} from "nx/src/generators/tree";
import {formatFiles, generateFiles} from "@nx/devkit";

export class PrototypeAuthService implements AuthService {
  private personas: Persona[];
  private tree: FsTree;

  public constructor(personas: Persona[], tree: FsTree) {
    this.personas = personas;
    this.tree = tree;
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

    await this.savePersonas();

    return userId;
  }

  private async savePersonas(): Promise<void> {
    generateFiles(this.tree, __dirname + '/files', '.', {
      tmpl: '',
      toJSON: (obj: unknown): string => {
        return JSON.stringify(obj, null, 2);
      },
      personas: this.personas,
    })

    await formatFiles(this.tree);

    const changes = this.tree.listChanges();

    flushChanges(this.tree.root, changes);
  }
}
