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

  /**
   * 
   * @param fileList
   * @returns array of FileTree objects
   */
  static fileListToFileTrees(fileList: FileList): FileTree[] {
    // Convert to array
    const files = [];
    const fileTrees = [] as FileTree[];

    for (let i = 0; i < fileList.length; i++) {
      files.push(fileList[i]);
    }

    files.forEach((file: any) => {
      //console.log('File', file);
      const path = file.webkitRelativePath as string;
      if (path) {
        const pathComponents = path.split('/');
        let children = fileTrees;
        pathComponents.forEach((pc, i) => {
          //console.log(`pc: ${pc}`);
          let f = children.find(c => c.name === pc);
          if (!f) {
            //console.log(`Creating FileTree for ${pc}`);
            f = new FileTree(pc, i === pathComponents.length - 1 ? file : null);
            children.push(f);
          }
          children = f.children;
        });
      }
    });

    return fileTrees;
  }

  static async itemListToFileTrees(itemList: DataTransferItemList): Promise<FileTree[]> {
    // Convert to array
    const entries = [] as any[];
    const fileTrees = [] as FileTree[];

    for (let i = 0; i < itemList.length; i++) {
      entries.push(itemList[i].webkitGetAsEntry());
    }

    for (const entry of entries) {
      fileTrees.push(await this.entryToFileTree(entry));
    }

    return fileTrees;
  }

  static async entryToFileTree(entry: any): Promise<FileTree> {
    let file = null;
    if (entry.isFile) {
      file = await this.getEntryFile(entry);
    }

    const fileTree = new FileTree(entry.name, file);

    if (entry.isDirectory) {
      const directoryReader = entry.createReader();

      const entries = await this.readEntries(directoryReader);
      for (const childEntry of entries) {
          fileTree.children.push(await this.entryToFileTree(childEntry));
      }
    }

    return fileTree;
  }

  static async readEntries(directoryReader: any): Promise<any[]> {
    return new Promise<any[]>(resolve => {
      directoryReader.readEntries((entries: any[]) => resolve(entries));
    });
  }

  static async getEntryFile(entry: any): Promise<File> {
    return new Promise<File>(resolve => {
      entry.file((file: File) => resolve(file))
    });
  }


}

