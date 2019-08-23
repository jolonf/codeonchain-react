import { MAX_TX_SIZE } from "./metanet";

export class FileTree {
  constructor(public name: string, public file: File | null, public children: FileTree[] = []) {}

  fileCount(): number {
    return 1 + (this.children.length === 0 ? 0 : this.children.map(fileTree => fileTree.fileCount()).reduce((sum, count) => sum + count));
  }

  /**
   * How many txs are required to upload this file tree.
   * Assumes bcat files and max tx size of MAX_TX_SIZE.
   */
  txCount(): number {
    let parts = Math.ceil(this.file!.size / MAX_TX_SIZE);
    // If there is more than one part then we also need to add one for the Bcat parent tx itself
    if (parts > 1) {
      parts++;
    }
    return parts + (this.children.length === 0 ? 0 : this.children.map(fileTree => fileTree.txCount()).reduce((sum, count) => sum + count));
  }

  isDirectory(): boolean {
    return this.file === null;
  }
}

