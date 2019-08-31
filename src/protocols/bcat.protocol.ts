import { MetanetNode } from "../metanet/metanet-node";
import { Cell, Metanet } from "../metanet/metanet";

import { Buffer } from 'buffer';
import { Protocol } from "./protocol";

/**
 * // http://bcat.bico.media/
 */
export class BcatProtocol {
  static address = '15DHFxWZJT58f9nhyGnsRBqrgwK4W6h4Up';
  static description = 'B://cat file';

  info  = '';
  mimeType    = '';
  encoding    = '';
  name        = '';
  txIds       = [] as string[];

  static fromCell(cell: Cell[]): BcatProtocol {
    const bcatProtocol = new BcatProtocol();
    bcatProtocol.info        = cell[1].s;
    bcatProtocol.mimeType    = cell[2].s;
    bcatProtocol.encoding    = cell[3].s;
    bcatProtocol.name        = cell[4].s;

    bcatProtocol.txIds = [];
    for (let i = 6; i < cell.length; i++) {
      const base64 = cell[i].b || cell[i].lb;
      const buffer = Buffer.from(base64, 'base64');
      bcatProtocol.txIds.push(buffer.toString('hex'));
    }

    if (bcatProtocol.mimeType && bcatProtocol.mimeType.trim() === '') {
      bcatProtocol.mimeType = Metanet.guessMimeType(bcatProtocol.name);
    }

    return bcatProtocol;
  }

  static toASM(partTxIds: string[], fileName: string, info = ' ', mimeType = ' ', encoding = ' ', flag = ' ') {
    return [
      this.address,
      info,
      mimeType,
      encoding,
      fileName,
      flag,
      ...partTxIds.map(txId => Buffer.from(txId, 'hex'))
    ];
  }

  static read(metanetNode: MetanetNode, cell: Cell[]) {
    metanetNode.mimeType = cell[2].s;
    metanetNode.encoding = cell[3].s;
    metanetNode.name     = cell[4].s;

    const txIds = [] as string[];
    for (let i = 6; i < cell.length; i++) {
      const base64 = cell[i].b || cell[i].lb;
      if (base64) {
        const buffer = Buffer.from(base64, 'base64');
        txIds.push(buffer.toString('hex'));
      }
    }
    metanetNode.partTxIds = txIds;

    if (metanetNode.mimeType && metanetNode.mimeType.trim() === '') {
      metanetNode.mimeType = Metanet.guessMimeType(metanetNode.name);
    }
  }
}

export interface BcatProtocol extends Protocol {}
