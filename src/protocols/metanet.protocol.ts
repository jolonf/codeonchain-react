import { MetanetNode } from "../metanet/metanet_node";
import { Cell } from "../metanet/metanet";

export class MetanetProtocol {
  static address = 'meta';

  static from(nodeAddress: string, parentTxId: string | null) {
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