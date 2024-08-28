import {Filesystem} from "@event-engine/infrastructure/helpers/fs";

export class NoOpFilesystem implements Filesystem {
  constructor() {

  }

  existsSync(filename: string): boolean {
    return false;
  }

  writeFileSync(filename: string, content: string): void {
    throw new Error('Filesystem cannot be used in browser context');
  }
}
