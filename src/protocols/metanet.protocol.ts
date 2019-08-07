
export class MetanetProtocol {
  static id = 'meta';

  static from(nodeAddress: string, parentTxId: string | null) {
    return [
      this.id, // meta
      nodeAddress,
      (parentTxId === null ? 'NULL' : parentTxId)
    ];
  }
}