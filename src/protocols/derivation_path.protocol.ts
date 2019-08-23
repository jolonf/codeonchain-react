import { MetanetNode } from "../metanet/metanet_node";
import { Cell } from "../metanet/metanet";

/**
 *  https://github.com/jolonf/bitcom-protocols/blob/master/derivation-path-protocol.md
 */
export class DerivationPathProtocol {
  static address = '179UZJnghXeAMzH4kBRqLpqeoHRaefwyd2';

  static from(derivationPath: string): string[] {
    return [
      this.address,
      derivationPath
    ];
  }

  static read(metanetNode: MetanetNode, cell: Cell[]) {
    metanetNode.derivationPath = cell[1].s || cell[1].ls;
  }

}