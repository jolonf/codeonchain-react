import { MetanetNode } from "./metanet_node";

export class Repo extends MetanetNode {
  description = '';
  sponsor = {} as any;
  version = '';
  github = '';

  constructor(nodeAddress: string, nodeTxId: string, bsvpushJson: any) {
    super();
    this.nodeAddress = nodeAddress;
    this.nodeTxId = nodeTxId;
    this.name = bsvpushJson.name;
    this.description = bsvpushJson.description;
    this.version = bsvpushJson.version;
    this.github = bsvpushJson.github;

    if (bsvpushJson.sponsor) {
      const defaults = {
        amount: "1",
        currency: "USD",
        label: "Tip",
        clientIdentifier: "3fb24dea420791729b4d9b39703c6339",
        buttonId: this.nodeTxId,
        buttonData: "{}",
        type: "tip"
      };
      this.sponsor = Object.assign(defaults, bsvpushJson.sponsor);
    }
  }
}