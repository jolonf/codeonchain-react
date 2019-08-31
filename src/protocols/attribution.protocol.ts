import { Cell } from "../metanet/metanet";
import { MetanetNode } from "../metanet/metanet-node";
import { Attribution } from "../storage/attribution";
import { Protocol } from "./protocol";

/**
 * https://github.com/jolonf/bitcom-protocols/blob/master/attribution-protocol.md
 */
export class AttributionProtocol {
  static address = '14aRXSJYPorVuDNET3CzCWZmKh8K7dfqT7';
  static description = 'Attribution';

  name = '';
  contact = '';
  role = '';
  license = '';
  sponsor = '';
  defaultAmount = '';
  currency = '';

  static fromCell(cell: Cell[]): AttributionProtocol {
    const attribution = new AttributionProtocol();
    attribution.name          = cell[1].s;
    attribution.contact       = cell[2].s;
    attribution.role          = cell[3].s;
    attribution.license       = cell[4].s;
    attribution.sponsor       = cell[5].s;
    attribution.defaultAmount = cell[6].s;
    attribution.currency      = cell[7].s;

    return attribution;
  }

  static toASM(attribution: Attribution) {
    return [
      this.address,
      attribution.name,
      attribution.contact,
      attribution.role,
      attribution.license,
      attribution.sponsor,
      attribution.defaultAmount,
      attribution.currency
    ];
  }

  static read(metanetNode: MetanetNode, cell: Cell[]) {
    metanetNode.attributions.push(Attribution.from(this.fromCell(cell)));
  }
}
export interface AttributionProtocol extends Protocol {}
