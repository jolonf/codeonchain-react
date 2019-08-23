import { MetanetNode } from "../metanet/metanet_node";
import { Cell, Metanet } from "../metanet/metanet";

import { Buffer } from 'buffer';

/**
 * // http://bcat.bico.media/
 */
export class BcatProtocol {
  static address = '15DHFxWZJT58f9nhyGnsRBqrgwK4W6h4Up';

  static from(partTxIds: string[], fileName: string, info = ' ', mimeType = ' ', encoding = ' ', flag = ' ') {
    return [
      this.address,
      info,
      mimeType,
      encoding,
      fileName,
      flag,
      ...partTxIds
    ];
  }

  static read(metanetNode: MetanetNode, cell: Cell[]) {
    metanetNode.mimeType = cell[2].s;
    metanetNode.encoding = cell[3].s;
    metanetNode.name     = cell[4].s;

    const txIds = [] as string[];
    for (let i = 6; i < cell.length; i++) {
      const base64 = cell[i].b || cell[i].lb;
      const buffer = Buffer.from(base64, 'base64');
      txIds.push(buffer.toString('hex'));
    }
    metanetNode.partTxIds = txIds;

    if (metanetNode.mimeType && metanetNode.mimeType.trim() === '') {
      metanetNode.mimeType = Metanet.guessMimeType(metanetNode.name);
    }
  }

}