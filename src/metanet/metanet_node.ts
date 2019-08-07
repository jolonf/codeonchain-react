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

  isDirectory(): boolean {
    return this.protocol === DirectoryProtocol.address;
  }

  /**
   * Returns next free derivation path of children.
   */
  nextFreeDerivationPath() {
    if (this.children.length === 0) {
      return `${this.derivationPath}/0`;
    }
    console.log('children', this.children);
    // Go through children and find highest derivation path
    const indexes = this.children.map(c => parseInt(c.derivationPath.split('/').pop()!));
    const highest = indexes.reduce((max, i) => max! > i! ? max : i);
    return `${this.derivationPath}/${highest + 1}`;
  }
}