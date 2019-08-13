import { DirectoryProtocol } from "../protocols/directory.protocol";

export class MetanetNode {
  nodeAddress = '';
  nodeTxId = '';
  parentTxId = '';
  protocol = '';
  name = '';
  mimeType = '';
  encoding = '';
  derivationPath = '';

  dataString = '';
  dataHex = '';

  children = [] as MetanetNode[];

  fee = 0;

  spentVouts = [] as number[];

  isDirectory(): boolean {
    return this.protocol === DirectoryProtocol.address;
  }

  /**
   * Returns next free derivation path of children.
   */
  nextFreeDerivationPath() {
    return `${this.derivationPath}/${this.nextFreeDerivationIndex()}`;
  }

  nextFreeDerivationIndex() {
    if (this.children.length === 0) {
      return 0;
    }
    // Go through children and find highest derivation path
    const indexes = this.children.map(c => parseInt(c.derivationPath.split('/').pop()!));
    const highest = indexes.reduce((max, i) => max! > i! ? max : i);
    return highest + 1;
  }

  childWithName(name: string): MetanetNode | undefined {
    return this.children.find(c => c.name === name);
  }
}