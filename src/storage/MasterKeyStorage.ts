
export interface MasterKeyEntry {
  masterKey: string; // xpriv
  publicAddress: string;
  txId: string;
  repoName: string;
}

export class MasterKeyStorage {

  static getMasterKeys(): MasterKeyEntry[] | undefined {
    if (window.localStorage) {
      let masterKeysJson = window.localStorage.masterKeys;

      if (masterKeysJson) {
        const masterKeys = JSON.parse(masterKeysJson);
        return masterKeys;
      }
    }
  }

  static storeMasterKey(masterKey: any, txId: string, repoName: string) {
    // Retrieve
    if (window.localStorage) {
      let masterKeysJson = window.localStorage.masterKeys;

      if (!masterKeysJson) {
        masterKeysJson = '[]';
      }

      const masterKeys = JSON.parse(masterKeysJson);

      masterKeys.push({
        masterKey: masterKey.xprivkey,
        publicAddress: masterKey.deriveChild('m/0').publicKey.toAddress().toString(),
        txId: txId,
        repoName: repoName
      });

      window.localStorage.masterKeys = JSON.stringify(masterKeys, null, 2);

    } else {
      console.log('No local storage to store master key!');
    }
  }

  static getMasterKey(publicAddress: string): MasterKeyEntry | undefined {
    if (window.localStorage) {
      let masterKeysJson = window.localStorage.masterKeys;

      if (masterKeysJson) {
        const masterKeys = JSON.parse(masterKeysJson);
        return masterKeys.find((entry: MasterKeyEntry) => entry.publicAddress === publicAddress);
      }
    }
  }

  static importFromJSON(importText: string): MasterKeyEntry[] | undefined {
    if (window.localStorage) {
      const masterKeys = this.getMasterKeys() || [] as MasterKeyEntry[];

      const newMasterKeys = JSON.parse(importText) as MasterKeyEntry[];

      for (const newEntry of newMasterKeys) {
        const previousEntry = masterKeys.find((entry, i) => entry.publicAddress === newEntry.publicAddress);
        if (!previousEntry) {
          masterKeys.push(newEntry);
        } else {
          Object.assign(previousEntry, newEntry);
        }
      }

      window.localStorage.masterKeys = JSON.stringify(masterKeys, null, 2);

      return masterKeys;
    }
  }
}