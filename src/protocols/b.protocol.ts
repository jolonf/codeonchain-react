import { MetanetNode } from "../metanet/metanet-node";
import { Cell, Metanet } from "../metanet/metanet";
import { Protocol } from './protocol';

/**
 * B:// format https://github.com/unwriter/B
 */
export class BProtocol {
  static address = '19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut';
  static description = 'B:// file';

  dataString  = '';
  dataBase64  = '';
  mimeType    = '';
  encoding    = '';
  name        = '';

  static fromCell(cell: Cell[]): BProtocol {
    const b = new BProtocol();
    b.dataString  = cell[1].s || cell[1].ls || ''; // s and b will be missing if zero length
    b.dataBase64  = cell[1].b || cell[1].lb || '';
    b.mimeType    = cell[2].s;
    b.encoding    = cell[3].s;
    b.name        = cell[4].s || '';

    if (b.mimeType && b.mimeType.trim() === '') {
      b.mimeType = Metanet.guessMimeType(b.name);
    }

    return b;
  }

  static toASM(data: Buffer | string, fileName: string, mimeType = ' ', encoding = ' ') {
    if (mimeType.length === 0) {
      mimeType = ' ';
    }
    return [
      this.address, // B://
      data, 
      mimeType, 
      encoding,
      fileName
    ];
  }

  static read(metanetNode: MetanetNode, cell: Cell[]) {
    metanetNode.dataString  = cell[1].s || cell[1].ls || '';
    metanetNode.dataBase64  = cell[1].b || cell[1].lb;
    metanetNode.mimeType    = cell[2].s;
    metanetNode.encoding    = cell[3].s;
    metanetNode.name        = (cell[4] && cell[4].s) || '';

    if (metanetNode.name && metanetNode.mimeType && metanetNode.mimeType.trim() === '') {
      metanetNode.mimeType = Metanet.guessMimeType(metanetNode.name);
    }
  }
}
export interface BProtocol extends Protocol {}
