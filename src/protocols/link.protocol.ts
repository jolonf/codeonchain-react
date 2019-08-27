import { Metanet, Cell } from "../metanet/metanet";
import { MetanetNode } from "../metanet/metanet_node";


export class LinkProtocol {
  static address = '12UqxsvAW8bwtwQbGzgW3jJWVkuEuq2rGA';
  static description = 'Link';

  txId = '';
  name = '';
  protocolHint = '';
  mimeType = '';

  static fromCell(cell: Cell[]): LinkProtocol {
    const link = new LinkProtocol();
    link.txId         = cell[1].s;
    link.name         = cell[2].s;
    link.protocolHint = cell[3].s;
    link.mimeType     = cell[4].s;

    if (link.mimeType && link.mimeType.trim() === '') {
      link.mimeType = Metanet.guessMimeType(link.name);
    }

    return link;
  }

  static toASM(txId: string, name: string, protocolHint = ' ', mimeType = ' ') {
    return [
      this.address, // Link
      txId,
      name,
      protocolHint,
      mimeType
    ];
  }

  static read(metanetNode: MetanetNode, cell: Cell[]) {
    metanetNode.link = this.fromCell(cell);
    metanetNode.name = metanetNode.link.name;
    metanetNode.mimeType = metanetNode.link.mimeType;
  }
}