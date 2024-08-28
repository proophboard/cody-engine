import {Filesystem} from "@event-engine/infrastructure/helpers/fs";
import * as fs from "node:fs";

export class NodeFilesystem implements Filesystem {
  private nodeFs: Filesystem;

  constructor() {
      this.nodeFs = fs;
  }

  existsSync(filename: string): boolean {
    return this.nodeFs.existsSync(filename);
  }

  writeFileSync(filename: string, content: string): void {
    this.nodeFs.writeFileSync(filename, content);
  }
}
