import { MetanetNode } from "../metanet/metanet_node";
import { Cell, Metanet } from "../metanet/metanet";

/**
 * B:// format https://github.com/unwriter/B
 */
export class BProtocol {
  static address = '19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut';

  static from(data: Buffer | string, fileName: string, mimeType = ' ', encoding = ' ') {
    return [
      this.address, // B://
      data, // Data
      mimeType, // Media Type
      encoding, // Encoding
      fileName // Filename
    ];
  }

  static read(metanetNode: MetanetNode, cell: Cell[]) {
    metanetNode.dataString  = cell[1].s || cell[1].ls;
    metanetNode.dataBase64  = cell[1].b || cell[1].lb;
    metanetNode.mimeType    = cell[2].s;
    metanetNode.encoding    = cell[3].s;
    metanetNode.name        = cell[4].s;

    if (metanetNode.mimeType && metanetNode.mimeType.trim() === '') {
      metanetNode.mimeType = Metanet.guessMimeType(metanetNode.name);
    }
  }

}