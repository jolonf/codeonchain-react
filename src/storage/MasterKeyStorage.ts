
interface MasterKeyEntry {
  masterKey: string; // xpriv
  publicAddress: string;
  txId: string;
  repoName: string;
}

export class MasterKeyStorage {

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

  static getMasterKey(publicAddress: string): any | undefined {
    if (window.localStorage) {
      let masterKeysJson = window.localStorage.masterKeys;

      if (masterKeysJson) {
        const masterKeys = JSON.parse(masterKeysJson);
        return masterKeys.find((entry: MasterKeyEntry) => entry.publicAddress === publicAddress);
      }
    }
  }
}