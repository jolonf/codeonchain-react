
export class FileTree {
  constructor(public name: string, public file: File | null, public children: FileTree[] = []) {}

  fileCount(): number {
    return 1 + (this.children.length === 0 ? 0 : this.children.map(fileTree => fileTree.fileCount()).reduce((sum, count) => sum + count));
  }

  isDirectory(): boolean {
    return this.file === null;
  }
}

