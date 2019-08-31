import { MetanetNode } from "../metanet/metanet-node";
import { Cell } from "../metanet/metanet";
import { Protocol } from "./protocol";

/**
 *  https://github.com/jolonf/bitcom-protocols/blob/master/directory-protocol.md
 */
export class DirectoryProtocol {
  static address = '1FR1dTwavR2exZvy2JxKL2Dv2nCMEMtB5N';
  static description = 'Directory';

  name = '';

  static fromCell(cell: Cell[]): DirectoryProtocol {
    const directoryProtocol = new DirectoryProtocol();
    directoryProtocol.name  = cell[1].s || cell[1].ls;
    return directoryProtocol;
  }

  static toASM(folderName: string) {
    return [
      this.address,
      folderName
    ];
  }

  static read(metanetNode: MetanetNode, cell: Cell[]) {
    metanetNode.name = cell[1].s;
  }
}
export interface DirectoryProtocol extends Protocol {}
