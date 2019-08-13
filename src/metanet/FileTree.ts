
export class FileTree {
  constructor(public name: string, public file: File | null, public children: FileTree[] = []) {}
}

