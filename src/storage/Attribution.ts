
import { AttributionProtocol } from '../protocols/attribution.protocol';

export class Attribution {

  name = '';
  contact = '';
  role = '';
  license = '';
  sponsor = '';
  defaultAmount = '';
  currency = '';

  include = true; // Include in attribution list for transactions, doesn't prevent it from being stored

  static from(attributionProtocol: AttributionProtocol): Attribution {
    const attribution = new Attribution();

    attribution.name = attributionProtocol.name;
    attribution.contact = attributionProtocol.contact;
    attribution.role = attributionProtocol.role;
    attribution.license = attributionProtocol.license;
    attribution.sponsor = attributionProtocol.sponsor;
    attribution.defaultAmount = attributionProtocol.defaultAmount;
    attribution.currency = attributionProtocol.currency;

    return attribution;
  }
}