import BitIndexSDK from 'bitindex-sdk';
import bsv from 'bsv';
import { readAsArrayBuffer } from 'promise-file-reader';
import { Buffer } from 'buffer';
//import { inflate } from 'pako';

import { MetanetNode } from "./metanet_node";
import { BProtocol } from '../protocols/b.protocol';
//import { BcatProtocol } from '../protocols/bcat.protocol';
import { DerivationPathProtocol } from '../protocols/derivation_path.protocol';
import { MetanetProtocol } from '../protocols/metanet.protocol';
import { DirectoryProtocol } from '../protocols/directory.protocol';
import { FileTree } from './FileTree';

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

  static async getChildren(txId: string): Promise<MetanetNode[]> {
    const results = await Promise.all([
      this.getChildFiles(txId),
      this.getChildDirectories(txId)
    ]);

    return results[0].concat(results[1]);
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
          "out.s3": 1,  // Node address
          "out.s4": 1,  // Parent txId
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
          "out.s3": 1,  // Node address
          "out.s4": 1,  // Parent txId
          "out.s6": 1,  // Directory protocol
          "out.s7": 1,  // Directory name
          "out.s10": 1  // Derivation path
        }
      }
    });
  }

  static async getMetanetNodes(query: any): Promise<MetanetNode[]> {
    const url = PLANARIA_ENDPOINT + btoa(JSON.stringify(query));
    const response = await fetch(url, { headers: { key: '1DzNX2LzKrmoyYVyqMG46LLknzSd7TUYYP' } });
    const json = await response.json();
    //console.log(json);
    const children = [];

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

  /**
   * Estimates fees to send txs represented by the files in the array of file trees.
   * @param fileTrees 
   */
  static async estimateFileTreesFee(masterKey: any, parent: MetanetNode, fileTrees: FileTree[], callback: Function): Promise<number> {
    let fee = 0;

    // If the fileTree already exists, get children
    if (parent.nodeTxId) {
      const children = await Metanet.getChildren(parent.nodeTxId);
      parent.children = children;
    }

    let nextFreeDerivationIndex = parent.nextFreeDerivationIndex();

    for (const fileTree of fileTrees) {

      // Check if there is already a Metanet Node on the chain for this file tree
      let metanetNode = parent.childWithName(fileTree.name);

      if (!metanetNode) {
        metanetNode = new MetanetNode();
        metanetNode.name = fileTree.name;
        metanetNode.derivationPath = `${parent.derivationPath}/${nextFreeDerivationIndex}`;
        metanetNode.nodeAddress = masterKey.deriveChild(metanetNode.derivationPath).publicKey.toAddress().toString();
        nextFreeDerivationIndex++;
        parent.children.push(metanetNode);
      }

      metanetNode.parentTxId = parent.nodeTxId;

      callback(fileTree.name);
      console.log(`Estimating fees for: [${metanetNode.derivationPath}] ${fileTree.name}`);

      // Create a node for this file tree
      if (fileTree.file) {
        // Estimate fee for file
        // Read in data
        const arrayBuffer = await readAsArrayBuffer(fileTree.file);
        const buffer = Buffer.from(arrayBuffer);
        await this.fileDummyTx(masterKey, parent, metanetNode, buffer);
        fee += metanetNode.fee;
        console.log(`file fee: ${metanetNode.fee}`);
      } else {
        // Estimate fee for directory

        // Directory tx
        await this.folderDummyTx(masterKey, parent, metanetNode);
        fee += metanetNode.fee;
        console.log(`folder fee: ${metanetNode.fee}`);

        fee += await this.estimateFileTreesFee(masterKey, metanetNode, fileTree.children, callback);
      }
    }

    return fee;
  }

  static async sendFileTrees(masterKey: any, fundingTxId: string, vout: number, parent: MetanetNode, fileTrees: FileTree[], callback: Function) {
    parent.spentVouts = [];
    for (const fileTree of fileTrees) {
      callback(fileTree.name);
      let metanetNode = parent.childWithName(fileTree.name);

      if (metanetNode) {
        metanetNode.parentTxId = parent.nodeTxId;
        if (fileTree.file) {
          // Read in data
          const arrayBuffer = await readAsArrayBuffer(fileTree.file);
          const buffer = Buffer.from(arrayBuffer);
          const fileTx = await this.fileTx(masterKey, fundingTxId, parent, metanetNode, buffer);
          metanetNode.nodeTxId = fileTx.id;
          await this.send(fileTx);
          vout++;
        } else {
          const folderTx = await this.folderTx(masterKey, fundingTxId, parent, metanetNode);
          metanetNode.nodeTxId = folderTx.id;
          await this.send(folderTx);
          vout++;
          vout = await this.sendFileTrees(masterKey, fundingTxId, vout, metanetNode, fileTree.children, callback);
        }
      } else {
        console.log(`Child not found: ${fileTree.name}`);
      }
    }
    return vout;
  }

  static async createTx(masterKey: any, 
                        fundingTxId: string | null, 
                        parent: MetanetNode,
                        metanetNode: MetanetNode,
                        payload: (string | Buffer)[]) {
    const parentKey = masterKey.deriveChild(parent.derivationPath);
    const nodeAddress = masterKey.deriveChild(metanetNode.derivationPath).publicKey.toAddress().toString();

    // If the node doesn't have a parent tx id yet give it a fake one to ensure fee estimation is accurate
    if (!metanetNode.parentTxId) {
      metanetNode.parentTxId = '0'.repeat(64);
    }

    const opReturnPayload = [
      ...MetanetProtocol.from(nodeAddress, metanetNode.parentTxId), '|',
      ...payload, '|',
      ...DerivationPathProtocol.from(metanetNode.derivationPath)
    ];

    const opReturn = ['OP_FALSE', 'OP_RETURN', ...this.arrayToHexStrings(opReturnPayload)];

    const script = bsv.Script.fromASM(opReturn.join(' '))
    if (script.toBuffer().length > 100000) {
      throw new Error(`Maximum OP_RETURN size is 100000 bytes. Script is ${script.toBuffer().length} bytes.`)
    }

    let utxo = null;
    if (fundingTxId) {
      while (!(utxo = await this.findUtxoByFee(parent, fundingTxId, metanetNode.fee))) {
        console.log(`Waiting for UTXO for key: ${parent.nodeAddress}, txid: ${fundingTxId}, fee: ${metanetNode.fee}`);
        await this.sleep(1000);
      }
      console.log(`Using utxo with vout: ${utxo.vout} from address: ${parent.nodeAddress}`);
    } else {
      // If no funding tx id was provided then we are just creating a dummy tx for estimating fee
      utxo = this.dummyUtxo();
    }

    const utxos = [utxo];

    const tx = new bsv.Transaction().from(utxos);
    tx.addOutput(new bsv.Transaction.Output({ script: script.toString(), satoshis: 0 }));
    metanetNode.fee = this.estimateFee(tx);
    //console.log(`fee = ${fee}, name = ${fileName}`);
    tx.fee(metanetNode.fee);
    tx.sign(parentKey.privateKey);
    return tx;
  }

  static parentDerivationPath(derivationPath: string): string {
    //console.log('parentDerivationPath from: ' + derivationPath)
    const pathComponents = derivationPath.split('/');
    pathComponents.pop(); // remove last element
    return pathComponents.join('/');
  }

  static async fileTx(masterKey: any, fundingTxId: string | null, parent: MetanetNode, metanetNode: MetanetNode, data: Buffer | string) {
    const payload = BProtocol.from(data, metanetNode.name, ' ', ' ');
    return this.createTx(masterKey, fundingTxId, parent, metanetNode, payload);
  }

  static async fileDummyTx(masterKey: any, parent: MetanetNode, metanetNode: MetanetNode, data: Buffer | string) {
    return this.fileTx(masterKey, null, parent, metanetNode, data);
  }

  static async folderTx(masterKey: any, fundingTxId: string | null, parent: MetanetNode, metanetNode: MetanetNode) {
    const payload = DirectoryProtocol.from(metanetNode.name);
    return this.createTx(masterKey, fundingTxId, parent, metanetNode, payload);
  }

  static async folderDummyTx(masterKey: any, parent: MetanetNode, metanetNode: MetanetNode) {
    return this.folderTx(masterKey, null, parent, metanetNode);
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
    return Math.max(tx._estimateFee(), MIN_OUTPUT_VALUE);
  }

  static async findUtxoByVout(publicKey: any, txId: string, voutIndex: number): Promise<any> {
    const utxos = await this.bitindex.address.getUtxos(publicKey);
    return utxos.find((utxo: any) => utxo.txid === txId && utxo.vout === voutIndex);
  }

  static async findUtxoByFee(parent: MetanetNode, txId: string, fee: number): Promise<any> {
    const utxos = await this.bitindex.address.getUtxos(parent.nodeAddress);
    const utxo = utxos.find((utxo: any) => utxo.txid === txId && utxo.satoshis === fee && !parent.spentVouts.includes(utxo.vout));
    if (utxo) {
      parent.spentVouts.push(utxo.vout);
    }
    return utxo;
  }

  static async send(tx: any) {
    let response = await Metanet.bitindex.tx.send(tx.toString());
    if (!response.txid) {
      console.log(response);
      throw new Error(JSON.stringify(response, null, 2));
    }
    return response;
  }

  /**
   * Validates the master key xpriv by deriving the child key for the metanetNode from it
   * derivation path and then compares the derived address with the metanetNode's address.
   * @param xprivkey 
   * @param metanetNode 
   */
  static validateMasterKey(xprivkey: string, metanetNode: MetanetNode): boolean {
    const masterKey = bsv.HDPrivateKey(xprivkey);
    const derivedAddress = masterKey.deriveChild(metanetNode.derivationPath).publicKey.toAddress().toString();
    return metanetNode.nodeAddress === derivedAddress;
  }

  /**
   * Bitcoin has a maximum mempool chain of 25 unconfirmed parent transactions.
   * Get all unconfirmed transactions for the funding address and ensure that the
   * total outputs that are unconfirmed are below 25.
   * @param fundingTxId
   */
  static async waitForUnconfirmedParents(fundingTxId: string, statusCallback: Function) {
    await this.waitForFundingTransactionToAppear(fundingTxId);

    while (await this.memPoolChainLength(fundingTxId) >= 25) {
      const message = `Waiting for unconfirmed parents (Bitcoin has a maximum of 25 unconfirmed parents), this could take 10 minutes or longer... 
Do not refresh or close the window as the files have not been uploaded yet.
This has occurred either because more than 25 files are being uploaded, or previous Money Button transactions have yet to be confirmed.
The Money Button transaction is: ${fundingTxId}`;
      console.log(message);
      statusCallback(message);
  
      await this.sleep(2000);
    }
  }

  /**
   * Wait for funding TX to appear before checking unconfirmed parents.
   * @param fundingTx
   */
  static async waitForFundingTransactionToAppear(fundingTxId: string) {
    console.log(`Waiting for funding transaction to appear on network... (tx id: ${fundingTxId})`);
    while (!(await this.bitindex.tx.get(fundingTxId)).txid) {
      await this.sleep(1000);
    }
  }

  /**
   * Walk through tx inputs recursively counting outputs of unconfirmed txs
   * until confirmed tx reached.
   * @param txId 
   */
  static async memPoolChainLength(txId: string): Promise<number> {
    let chainLength = 0;
    const result = await this.bitindex.tx.get(txId);

    if (result.confirmations === 0) {
      chainLength += result.vout.length;

      // Check inputs
      for (const vin of result.vin) {
        chainLength += await this.memPoolChainLength(vin.txid);
      }
    }

    return chainLength;
  }

  static async sleep(ms: number) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
  }
}