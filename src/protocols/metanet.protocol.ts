import { MetanetNode } from "../metanet/metanet-node";
import { Cell } from "../metanet/metanet";
import { Protocol } from "./protocol";

export class MetanetProtocol {
  static address = 'meta';
  static description = 'Metanet';

  nodeAddress = '';
  parentTxId = '';

  static fromCell(cell: Cell[]): MetanetProtocol {
    const metanetProtocol = new MetanetProtocol();
    metanetProtocol.nodeAddress = cell[1].s;
    metanetProtocol.parentTxId  = cell[2].s;
    return metanetProtocol;
  }

  static toASM(nodeAddress: string, parentTxId: string | null) {
    return [
      this.address, // meta
      nodeAddress,
      (parentTxId === null ? 'NULL' : parentTxId)
    ];
  }

  static read(metanetNode: MetanetNode, cell: Cell[]) {
    metanetNode.nodeAddress = cell[1].s;
    metanetNode.parentTxId  = cell[2].s;
  }
}
export interface MetanetProtocol extends Protocol {}
