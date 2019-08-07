import BitIndexSDK from 'bitindex-sdk';
import bsv from 'bsv';
import { Buffer } from 'buffer';
//import { inflate } from 'pako';

import { MetanetNode } from "./metanet_node";
import { BProtocol } from '../protocols/b.protocol';
//import { BcatProtocol } from '../protocols/bcat.protocol';
import { DerivationPathProtocol } from '../protocols/derivation_path.protocol';
import { MetanetProtocol } from '../protocols/metanet.protocol';
import { DirectoryProtocol } from '../protocols/directory.protocol';

export const METANET_FLAG     = 'meta';
export const MIN_OUTPUT_VALUE = 546;

//const METANARIA_ENDPOINT = 'https://metanaria.planaria.network/q/';
const GENESIS_ENDPOINT = 'https://genesis.bitdb.network/q/1FnauZ9aUH2Bex6JzdcV4eNX7oLSSEbxtN/';

const PLANARIA_ENDPOINT = GENESIS_ENDPOINT;

export class Metanet {

  static bitindex = new BitIndexSDK();

  static async getMetanetNode(txId: string): Promise<MetanetNode> {
    const metanetNodes = await this.getMetanetNodes({
      "v": 3,
      "q": {
          "find": {
              "tx.h": txId
          },
          "project": {
              "tx.h": 1,
              "out": 1
          }
      }
    });

    return metanetNodes[0];
  }

  static async getChildFiles(txId: string): Promise<MetanetNode[]> {
    return this.getMetanetNodes({
      "v": 3,
      "q": {
        "find": {
          "out.s4": txId, // Parent tx
          "out.s6": BProtocol.address
        },
        "project": {
          "tx.h": 1,
          "out.s6": 1,  // File protocol
          "out.s10": 1, // File name
          "out.s13": 1  // Derivation path
        }
      }
    });
  }

  static async getChildDirectories(txId: string): Promise<MetanetNode[]> {
    return this.getMetanetNodes({
      "v": 3,
      "q": {
        "find": {
          "out.s4": txId, // Parent tx
          "out.s6": DirectoryProtocol.address
        },
        "project": {
          "tx.h": 1,
          "out.s6": 1,  // Directory protocol
          "out.s7": 1, // Directory name
          "out.s10": 1  // Derivation path
        }
      }
    });
  }

  static async getMetanetNodes(query: any): Promise<MetanetNode[]> {
    const url = PLANARIA_ENDPOINT + btoa(JSON.stringify(query));
    const response = await fetch(url, { headers: { key: '1DzNX2LzKrmoyYVyqMG46LLknzSd7TUYYP' } });
    const json = await response.json();
    console.log(json);
    const children = [];

/*    for (const metanet of json.metanet) { 
      let metanetNode = new MetanetNode();

      metanetNode.nodeAddress = metanet.out[0].s3;
      metanetNode.nodeTxId = metanet.tx.h;
      metanetNode.parentTxId = metanet.out[0].s4;
      metanetNode.protocol = metanet.out[0].s6;
      metanetNode.mimeType = metanet.out[0].s8;
      metanetNode.encoding = metanet.out[0].s9;

      if (metanetNode.isDirectory()) {
        metanetNode.name = metanet.out[0].s7;
      } else {
        metanetNode.name = metanet.out[0].s10;
      }

      if (metanetNode.mimeType && metanetNode.mimeType.trim() === '') {
        metanetNode.mimeType = this.guessMimeType(metanetNode.name);
      }

      metanetNode.derivationPath = metanet.out[0].s13;

      metanetNode.dataString = metanet.out[0].s7;
      metanetNode.dataHex = metanet.out[0].h7;

      children.push(metanetNode);
    }*/

    const items = json.u.concat(json.c);

    for (const metanet of items) { 
      let metanetNode = new MetanetNode();

      metanetNode.nodeAddress = metanet.out[0].s3;
      metanetNode.nodeTxId = metanet.tx.h;
      metanetNode.parentTxId = metanet.out[0].s4;
      metanetNode.protocol = metanet.out[0].s6;
      metanetNode.mimeType = metanet.out[0].s8;
      metanetNode.encoding = metanet.out[0].s9;

      if (metanetNode.isDirectory()) {
        metanetNode.name = metanet.out[0].s7;
        metanetNode.derivationPath = metanet.out[0].s10;
      } else {
        metanetNode.name = metanet.out[0].s10;
        metanetNode.derivationPath = metanet.out[0].s13;
      }

      if (metanetNode.mimeType && metanetNode.mimeType.trim() === '') {
        metanetNode.mimeType = this.guessMimeType(metanetNode.name);
      }

      metanetNode.dataString = metanet.out[0].s7;
      metanetNode.dataHex = metanet.out[0].h7;

      children.push(metanetNode);
    }

    return children;
  }

  static guessMimeType(name: string): string {
    let mimeType = '';
    const ext = name.split('.').pop();
    const imgFileExts = ['png', 'gif', 'jpg', 'jpeg'];
    if (imgFileExts.find(e => e === ext)) {
      mimeType = `image/${ext}`;
    } else if (ext === 'svg') {
      mimeType = `image/svg+xml`;
    } else {
      mimeType = `text/plain`;
    }
    return mimeType;
  }

  static async getBcatData(parts: string[]): Promise<Buffer> {
    const buffers = [];
    // Bcat parts start at index 10
    let i = 10;
    let txId;
    while (i < parts.length && (txId = parts[i++]).length === 64) {
      console.log(`\tFetching part ${i-10}: ${txId}.`);
      const response = await fetch(`https://bico.media/${txId}`);
      buffers.push(Buffer.from(await response.arrayBuffer()));
    }
    return Buffer.concat(buffers);
  }

  static async createTx(masterKey: any, derivationPath: string, fundingTxId: string | null, vout: number, parentTxId: string | null, payload: (string | Buffer)[]) {
    const parentKey = masterKey.deriveChild(this.parentDerivationPath(derivationPath));
    const nodeAddress = masterKey.deriveChild(derivationPath).publicKey.toAddress().toString();

    const opReturnPayload = [
      ...MetanetProtocol.from(nodeAddress, parentTxId), '|',
      ...payload, '|',
      ...DerivationPathProtocol.from(derivationPath)
    ];

    const opReturn = ['OP_FALSE', 'OP_RETURN', ...this.arrayToHexStrings(opReturnPayload)];

    const script = bsv.Script.fromASM(opReturn.join(' '))
    if (script.toBuffer().length > 100000) {
      throw new Error(`Maximum OP_RETURN size is 100000 bytes. Script is ${script.toBuffer().length} bytes.`)
    }

    let utxo = null;
    if (fundingTxId) {
      while (!(utxo = await this.findUtxo(parentKey.publicKey.toAddress().toString(), fundingTxId, vout))) {
        console.log(`Waiting for UTXO for key: ${parentKey.publicKey.toAddress().toString()}, txid: ${fundingTxId}, vout: ${vout}`);
        await this.sleep(1000);
      }
    } else {
      // If no funding tx id was provided then we are just creating a dummy tx for estimating fee
      utxo = this.dummyUtxo();
    }

    const utxos = [utxo];

    const tx = new bsv.Transaction().from(utxos);
    tx.addOutput(new bsv.Transaction.Output({ script: script.toString(), satoshis: 0 }));
    const fee = this.estimateFee(tx);
    //console.log(`fee = ${fee}, name = ${fileName}`);
    tx.fee(fee);
    tx.sign(parentKey.privateKey);
    return tx;
  }

  static parentDerivationPath(derivationPath: string): string {
    console.log('parentDerivationPath from: ' + derivationPath)
    const pathComponents = derivationPath.split('/');
    pathComponents.pop(); // remove last element
    return pathComponents.join('/');
  }

  static async fileTx(masterKey: any, derivationPath: string, fundingTxId: string | null, vout: number, parentTxId: string | null, fileName: string, data: Buffer | string) {
    const payload = BProtocol.from(data, fileName, ' ', ' ');
    return this.createTx(masterKey, derivationPath, fundingTxId, vout, parentTxId, payload);
  }

  static async fileDummyTx(masterKey: any, derivationPath: string, fileName: string, data: Buffer | string) {
    return this.fileTx(masterKey, derivationPath, null, 0, null, fileName, data);
  }

  static async folderTx(masterKey: any, derivationPath: string, fundingTxId: string | null, vout: number, parentTxId: string | null, folderName: string) {
    const payload = DirectoryProtocol.from(folderName);
    return this.createTx(masterKey, derivationPath, fundingTxId, vout, parentTxId, payload);
  }

  static async folderDummyTx(masterKey: any, derivationPath: string, parentTxId: string | null, folderName: string) {
    return this.folderTx(masterKey, derivationPath, null, 0, parentTxId, folderName);
  }

  /**
   * Converts the OP_RETURN payload to hex strings.
   * @param array
   */
  static arrayToHexStrings(array: any[]): string[] {
    return array.map(e => { 
      if (e instanceof Buffer) {
        return e.toString('hex');
      } else if (typeof e === 'number') {
        return e.toString(16).padStart(2, '0');
      } else {
        return Buffer.from(e).toString('hex');
      }
    });
  }

  static dummyUtxo() {
    return bsv.Transaction.UnspentOutput({
      address: '19dCWu1pvak7cgw5b1nFQn9LapFSQLqahC',
      txId: 'e29bc8d6c7298e524756ac116bd3fb5355eec1da94666253c3f40810a4000804',
      outputIndex: 0,
      satoshis: 5000000000,
      scriptPubKey: '21034b2edef6108e596efb2955f796aa807451546025025833e555b6f9b433a4a146ac'
    });
  }

  static estimateFee(tx: any): number {
    //console.log(tx);
    return Math.max(tx._estimateFee(), MIN_OUTPUT_VALUE);
  }

  static async findUtxo(publicKey: any, txId: string, voutIndex: number): Promise<any[]> {
    const utxos = await this.bitindex.address.getUtxos(publicKey);
    return utxos.find((utxo: any) => utxo.txid === txId && utxo.vout === voutIndex);
  }

  static async send(tx: any) {
    let response = await Metanet.bitindex.tx.send(tx.toString());
    if (!response.txid) {
      throw new Error(response);
    }
    return response;
  }

  static async sleep(ms: number) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
  }

}