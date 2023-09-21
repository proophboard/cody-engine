export interface Filesystem {
  existsSync: (filename: string) => boolean;
  writeFileSync: (filename: string, content: string) => void;
}


export class NodeFilesystem implements Filesystem {
  private nodeFs: Filesystem | undefined;

  constructor() {
    // We're running on Node.JS, so we can use "fs" package
    if (typeof window === 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      this.nodeFs = require('fs');
    }
  }

  existsSync(filename: string): boolean {
    if(this.nodeFs) {
      return this.nodeFs.existsSync(filename);
    }

    return false;
  }

  writeFileSync(filename: string, content: string): void {
    if(!this.nodeFs) {
      throw new Error('NodeFilesystem cannot be used in browser context');
    }

    this.nodeFs.writeFileSync(filename, content);
  }
}
