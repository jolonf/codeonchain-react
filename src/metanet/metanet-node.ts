import { DirectoryProtocol } from "../protocols/directory.protocol";
import { LinkProtocol } from '../protocols/link.protocol';
import { Metanet } from "./metanet";

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
  dataBase64 = '';

  parent = null as MetanetNode | null;
  children = [] as MetanetNode[];
  partTxIds = [] as string[]; // Parts for Bcat
  link = null as LinkProtocol | null;

  // Used during fee estimation
  fee = 0;
  partFees = [] as number[]; // If this node has related txs (e.g. Bcat parts)

  // Used during sending to track used utxos
  spentVouts = [] as number[];

  constructor(parentTxId = '', masterKey: any | null = null, derivationPath: string = '', name = '') {
    this.parentTxId = parentTxId;
    if (masterKey && derivationPath) {
      this.derivationPath = derivationPath;
      this.nodeAddress = masterKey.deriveChild(derivationPath).publicKey.toAddress().toString();
      this.name = name;
    }
  }

  isDirectory(): boolean {
    return this.protocol === DirectoryProtocol.address;
  }

  isLink(): boolean {
    return !!this.link;
  }

  isLinkToDirectory(): boolean {
    return !!this.link && this.link.protocolHints.includes(DirectoryProtocol.address);
  }

  isRoot(): boolean {
    return this.parentTxId === 'NULL';
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

  childOrCreate(fileName: string, masterKey: any) {
    let child = this.childWithName(fileName);

    if (!child) {
      child = new MetanetNode(this.nodeTxId, masterKey, this.nextFreeDerivationPath(), fileName);
      child.parent = this;
    }

    return child;
  }

  /**
   * Loads, sets, and returns children.
   */
  async loadChildren(): Promise<MetanetNode[]> {
    this.children = await Metanet.getChildren(this.nodeAddress, this.nodeTxId);
    return this.children;
  }
}