import { Cell } from "../metanet/metanet";
import { MetanetNode } from "../metanet/metanet-node";
import { Protocol } from "./protocol";

/**
 * https://github.com/jolonf/bitcom-protocols/blob/master/repo-protocol.md
 */
export class RepoProtocol {
  static address = '14ncfV4MGFw7vQvkViPcJxKhUGABPVWVgt';
  static description = 'Repo';

  name = '';
  description = '';
  version = '';
  website = '';
  github = '';
  hidden = false;

  static fromCell(cell: Cell[]): RepoProtocol {
    const repo = new RepoProtocol();
    let hidden = '0';
    [
      ,
      {s: repo.name},
      {s: repo.description},
      {s: repo.version},
      {s: repo.website},
      {s: repo.github},
      {s: hidden}
    ] = cell;

    repo.hidden = hidden === '1';

    return repo;
  }

  static toASM(name: string, description: string, version: string, website: string, github: string, hidden = false) {
    return [
      this.address,
      name,
      description,
      version,
      website,
      github,
      hidden ? '1' : '0'
    ];
  }

  toASM() {
    return RepoProtocol.toASM(this.name, this.description, this.version, this.website, this.github, this.hidden);
  }

  static read(metanetNode: MetanetNode, cell: Cell[]) {
    metanetNode.repo = this.fromCell(cell);
  }
}
export interface RepoProtocol extends Protocol {}
