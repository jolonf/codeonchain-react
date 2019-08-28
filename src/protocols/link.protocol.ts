import { Metanet, Cell } from "../metanet/metanet";
import { MetanetNode } from "../metanet/metanet-node";

/**
 * https://github.com/jolonf/bitcom-protocols/blob/master/link-protocol.md
 */
export class LinkProtocol {
  static address = '12UqxsvAW8bwtwQbGzgW3jJWVkuEuq2rGA';
  static description = 'Link';

  txId = '';
  name = '';
  mimeType = '';
  protocolHints = [] as string[];

  static fromCell(cell: Cell[]): LinkProtocol {
    const link = new LinkProtocol();
    link.txId         = cell[1].s;
    link.name         = cell[2].s;
    link.mimeType     = cell[3].s;
    for (let i = 4; i < cell.length; i++) {
      link.protocolHints.push(cell[i].s);
    }
    if (link.mimeType && link.mimeType.trim() === '') {
      link.mimeType = Metanet.guessMimeType(link.name);
    }

    return link;
  }

  static toASM(txId: string, name: string, protocolHints = [] as string[], mimeType = ' ') {
    return [
      this.address, // Link
      txId,
      name,
      mimeType,
      ...protocolHints
    ];
  }

  static read(metanetNode: MetanetNode, cell: Cell[]) {
    metanetNode.link = this.fromCell(cell);
    metanetNode.name = metanetNode.link.name;
    metanetNode.mimeType = metanetNode.link.mimeType;
  }
}