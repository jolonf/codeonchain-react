import { MetanetNode } from "../metanet/metanet-node";
import { Cell } from "../metanet/metanet";
import { Protocol } from "./protocol";

/**
 *  https://github.com/torusJKL/BitcoinBIPs/blob/master/DIP.md
 */
export class DataIntegrityProtocol {
  static address = '1D1PdbxVxcjfovTATC3ginxjj4enTgxLyY';
  static description = 'Data Integrity';

  algorithm = '';
  digest = null as Buffer | null;
  indexUnitSize = '';
  fieldIndex = '';

  static fromCell(cell: Cell[]): DataIntegrityProtocol {
    const dataIntegrity = new DataIntegrityProtocol();
    dataIntegrity.algorithm       = cell[1].s;
    if (cell[2].b || cell[2].lb) {
      dataIntegrity.digest        = Buffer.from(cell[2].b || cell[2].lb, 'base64');
      dataIntegrity.indexUnitSize = Buffer.from(cell[3].b, 'base64').toString('hex');
      dataIntegrity.fieldIndex    = Buffer.from(cell[4].b, 'base64').toString('hex');
    }
    return dataIntegrity;
  }

  static toASM(algorithm: string, digest: Buffer, indexUnitSize: string, fieldIndex: string) {
    return [
      this.address,
      algorithm,
      digest,
      Buffer.from(indexUnitSize, 'hex'),
      Buffer.from(fieldIndex, 'hex'),
    ];
  }

  static read(metanetNode: MetanetNode, cell: Cell[]) {
    metanetNode.dataIntegrity = this.fromCell(cell);
  }
}
export interface DataIntegrityProtocol extends Protocol {}
