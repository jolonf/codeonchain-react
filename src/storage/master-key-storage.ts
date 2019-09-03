import bsv from 'bsv';
import { MetanetNode } from '../metanet/metanet-node';
import { Metanet } from '../metanet/metanet';

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

  static storeMasterKey(xprv: string, txId: string, repoName: string) {
    // Retrieve
    if (window.localStorage) {
      let masterKeysJson = window.localStorage.masterKeys;

      if (!masterKeysJson) {
        masterKeysJson = '[]';
      }

      const masterKeys = JSON.parse(masterKeysJson);

      let storedMasterKey = masterKeys.find((m: any) => m.masterKey === xprv);
      if (!storedMasterKey) {
        storedMasterKey = {} as any;
        masterKeys.push(storedMasterKey);
      }

      storedMasterKey.masterKey = xprv;
      storedMasterKey.publicAddress = bsv.HDPrivateKey(xprv).deriveChild('m/0').publicKey.toAddress().toString();
      storedMasterKey.txId = txId;
      storedMasterKey.repoName = repoName;

      window.localStorage.masterKeys = JSON.stringify(masterKeys, null, 2);

    } else {
      console.log('No local storage to store master key!');
    }
  }

  static getMasterKeyEntry(publicAddress: string): MasterKeyEntry | undefined {
    if (window.localStorage) {
      let masterKeysJson = window.localStorage.masterKeys;

      if (masterKeysJson) {
        const masterKeys = JSON.parse(masterKeysJson);
        return masterKeys.find((entry: MasterKeyEntry) => entry.publicAddress === publicAddress);
      }
    }
  }

  /**
   * Gets the root of the child and then the master key entry.
   * @param child 
   */
  static async getMasterKeyEntryForChild(child: MetanetNode): Promise<MasterKeyEntry | undefined> {
    const root = await Metanet.getRoot(child);
    if (root && window.localStorage) {
      let masterKeysJson = window.localStorage.masterKeys;

      if (masterKeysJson) {
        const masterKeys = JSON.parse(masterKeysJson);
        return masterKeys.find((entry: MasterKeyEntry) => entry.publicAddress === root.nodeAddress);
      }
    }
  }

  static getMasterKey(publicAddress: string): any {
    const masterKeyEntry = this.getMasterKeyEntry(publicAddress);

    if (masterKeyEntry) {
      return bsv.HDPrivateKey(masterKeyEntry.masterKey);
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