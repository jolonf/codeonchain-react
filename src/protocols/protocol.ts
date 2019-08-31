
import { Cell } from '../metanet/metanet';
import { MetanetNode } from '../metanet/metanet-node';

export interface Protocol {
  address: string;
  description: string;
  read(metanetNode: MetanetNode, cell: Cell): void;
}

