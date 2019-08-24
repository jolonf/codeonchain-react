import BitIndexSDK from 'bitindex-sdk';
import bsv from 'bsv';
import { readAsArrayBuffer } from 'promise-file-reader';
import { Buffer } from 'buffer';
//import { inflate } from 'pako';

import { MetanetNode } from "./metanet_node";
import { BProtocol } from '../protocols/b.protocol';
import { BcatPartProtocol } from '../protocols/bcat-part.protocol';
import { DerivationPathProtocol } from '../protocols/derivation_path.protocol';
import { MetanetProtocol } from '../protocols/metanet.protocol';
import { DirectoryProtocol } from '../protocols/directory.protocol';
import { FileTree } from './FileTree';
import { BcatProtocol } from '../protocols/bcat.protocol';

export const METANET_FLAG     = 'meta';
export const MIN_OUTPUT_VALUE = 546;
export const MAX_TX_SIZE      = 90000; // Any files larger will use Bcat protocol

//const METANARIA_ENDPOINT = 'https://metanaria.planaria.network/q/';
//const GENESIS_ENDPOINT = 'https://genesis.bitdb.network/q/1FnauZ9aUH2Bex6JzdcV4eNX7oLSSEbxtN/';
const BOB_ENDPOINT = 'https://bob.planaria.network/q/1GgmC7Cg782YtQ6R9QkM58voyWeQJmJJzG/';

const PLANARIA_ENDPOINT = BOB_ENDPOINT;

export interface Cell {
  s: string,
  ls: string,
  b: string,
  lb: string
}

export class Metanet {

  static bitindex = new BitIndexSDK();

  static protocols = [
    MetanetProtocol,
    BProtocol,
    BcatProtocol,
    BcatPartProtocol,
    DirectoryProtocol,
    DerivationPathProtocol
  ] as any[];

  static fileProtocols = [
    BProtocol.address,
    BcatProtocol.address,
    DirectoryProtocol.address
  ] as any[];

  static async getMetanetNode(txId: string): Promise<MetanetNode> {
    const metanetNodes = await this.getMetanetNodes({
      "v": 3,
      "q": {
          "find": {
              "tx.h": txId
          },
          "project": {
              "tx.h": 1,
              "out.tape.cell": 1,
          }
      }
    });

    return metanetNodes[0];
  }

  static async getChildren(parentAddress: string, txId: string): Promise<MetanetNode[]> {
    return this.getMetanetNodes({
      "v": 3,
      "q": {
        "find": {
          "in.e.a": parentAddress,
          "$and": [ 
            {
              "out.tape.cell": {
                "$elemMatch": {
                  "i": 0,
                  "s": "meta"
                }
              }
            },
            {
              "out.tape.cell": {
                "$elemMatch": {
                  "i": 2,
                  "s": txId
                }
              }
            }
          ]
        },
        "project": {
          "out.tape.cell.s": 1, "tx.h": 1
        }
      }
    });
  }

  static async getMetanetNodes(query: any): Promise<MetanetNode[]> {
    const url = PLANARIA_ENDPOINT + btoa(JSON.stringify(query));
    const response = await fetch(url, { headers: { key: '1DzNX2LzKrmoyYVyqMG46LLknzSd7TUYYP' } });
    const json = await response.json();
    //console.log(json);
    const children = [] as MetanetNode[];

    const items = json.u.reverse().concat(json.c);

    for (const item of items) { 
      const metanetNode = new MetanetNode();
      metanetNode.nodeTxId = item.tx.h;

      for (const cell of item.out[0].tape) {
        const protocolAddress = cell.cell[0].s;
        const protocol = this.protocols.find(p => p.address === protocolAddress);
        if (protocol) {
          protocol.read(metanetNode, cell.cell as Cell);
          if (this.fileProtocols.includes(protocolAddress)) {
            metanetNode.protocol = protocolAddress;
          }
        }
      }
      /// Only add node if there isn't an existing one with the same address as this is an older version
      if (!children.find(c => c.nodeAddress === metanetNode.nodeAddress)) {
        children.push(metanetNode);
      }
    }

    children.sort((a, b) => a.name < b.name ? -1 : 1);

    return children;
  }

  /**
   * Returns the root of the tree if it has been loaded, if not
   * loads missing parents.
   * @param node 
   */
  static async getRoot(node: MetanetNode): Promise<MetanetNode|undefined> {
    // Root node has a parent txid of NULL
    if (node.parentTxId === 'NULL') {
      return node;
    }

    if (!node.parent) {
      node.parent = await this.getMetanetNode(node.parentTxId);
    }
    if (node.parent) {
      return await this.getRoot(node.parent);
    }
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
      const children = await Metanet.getChildren(parent.nodeAddress, parent.nodeTxId);
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

      metanetNode.parent = parent;
      metanetNode.parentTxId = parent.nodeTxId;

      callback(fileTree.name);
      console.log(`Estimating fees for: [${metanetNode.derivationPath}] ${fileTree.name}`);

      if (fileTree.file) {
        // Estimate fee for file
        // Read in data
        const arrayBuffer = await readAsArrayBuffer(fileTree.file);
        const buffer = Buffer.from(arrayBuffer);
        if (buffer.length > MAX_TX_SIZE) {
          // Bcat
          await this.estimateBcatParts(metanetNode, buffer, callback);
          await this.bcatDummyTx(masterKey, metanetNode, metanetNode.partFees.map(() => '0'.repeat(64)));
          fee += metanetNode.partFees.reduce((sum, fee) => sum + fee);
        } else {
          await this.fileDummyTx(masterKey, metanetNode, buffer);
        }
        fee += metanetNode.fee;
        console.log(`file fee: ${metanetNode.fee}`);
      } else {
        // Estimate fee for directory

        // Directory tx
        await this.folderDummyTx(masterKey, metanetNode);
        fee += metanetNode.fee;
        console.log(`folder fee: ${metanetNode.fee}`);

        fee += await this.estimateFileTreesFee(masterKey, metanetNode, fileTree.children, callback);
      }
    }

    return fee;
  }

  static async estimateBcatParts(metanetNode: MetanetNode, data: Buffer, callback: Function) {
    metanetNode.partFees = [];
    const partCount = Math.ceil(data.length / MAX_TX_SIZE);
    for (let i = 0, offset = 0; i < partCount; i++, offset += MAX_TX_SIZE) {
      callback(`${metanetNode.name} (part ${i + 1})`);
      // Little sleep to ensure UI is updated
      await this.sleep(1);
      const buffer = data.subarray(offset, offset + MAX_TX_SIZE);
      const opReturn = ['OP_FALSE', 'OP_RETURN', ...this.arrayToHexStrings(BcatPartProtocol.from(buffer))];
      const script = bsv.Script.fromASM(opReturn.join(' '));
      const tx = new bsv.Transaction().from([this.dummyUtxo()]);
      tx.addOutput(new bsv.Transaction.Output({ script: script.toString(), satoshis: 0 }));

      metanetNode.partFees.push(this.estimateFee(tx));
    }
  }

  /**
   * Returns array of all txIds sent.
   * @param masterKey 
   * @param fundingTxId 
   * @param parent 
   * @param fileTrees 
   * @param callback 
   */
  static async sendFileTrees(masterKey: any, fundingTxId: string, parent: MetanetNode, fileTrees: FileTree[], callback: Function): Promise<string[]> {
    parent.spentVouts = [];
    const txIds = [] as string[];
    for (const fileTree of fileTrees) {
      callback(fileTree.name);
      let metanetNode = parent.childWithName(fileTree.name);

      if (metanetNode) {
        metanetNode.parent = parent;
        metanetNode.parentTxId = parent.nodeTxId;
        if (fileTree.file) {
          // Read in data
          const arrayBuffer = await readAsArrayBuffer(fileTree.file);
          const buffer = Buffer.from(arrayBuffer);
          if (buffer.length > MAX_TX_SIZE) {
            // Bcat
            const bcatPartTxIds = await this.sendBcatParts(masterKey, fundingTxId, metanetNode, buffer, callback);
            const bcatTx = await this.bcatTx(masterKey, fundingTxId, metanetNode, bcatPartTxIds);
            await this.send(bcatTx);
          } else {
            const fileTx = await this.fileTx(masterKey, fundingTxId, metanetNode, buffer);
            metanetNode.nodeTxId = fileTx.id;
            await this.send(fileTx);
          }
        } else {
          const folderTx = await this.folderTx(masterKey, fundingTxId, metanetNode);
          metanetNode.nodeTxId = folderTx.id;
          await this.send(folderTx);
          txIds.push(...await this.sendFileTrees(masterKey, fundingTxId, metanetNode, fileTree.children, callback));
        }
        txIds.push(metanetNode.nodeTxId);
      } else {
        console.log(`Child not found: ${fileTree.name}`);
      }
    }
    return txIds;
  }

  static async sendBcatParts(masterKey: any, fundingTxId: string, metanetNode: MetanetNode, data: Buffer, callback: Function): Promise<string[]> {
    if (!metanetNode.parent) {
      throw new Error(`MetanetNode must have parent set: ${metanetNode.name}`);
    }

    const bcatTxIds = [] as string[];

    const partCount = Math.ceil(data.length / MAX_TX_SIZE);

    for (let i = 0, offset = 0; i < partCount; i++, offset += MAX_TX_SIZE) {
      callback(`${metanetNode.name} (part ${i + 1})`);
      const buffer = data.subarray(offset, offset + MAX_TX_SIZE);
      const opReturn = ['OP_FALSE', 'OP_RETURN', ...this.arrayToHexStrings(BcatPartProtocol.from(buffer))];

      const parentKey = masterKey.deriveChild(metanetNode.parent.derivationPath);
      let utxo = null;
      while (!(utxo = await this.findUtxoByFee(metanetNode.parent, fundingTxId, metanetNode.fee))) {
        console.log(`Waiting for UTXO for key: ${metanetNode.parent.nodeAddress}, txid: ${fundingTxId}, fee: ${metanetNode.fee}`);
        await this.sleep(1000);
      }
      
      const script = bsv.Script.fromASM(opReturn.join(' '));
      const tx = new bsv.Transaction().from([utxo]);
      tx.addOutput(new bsv.Transaction.Output({ script: script.toString(), satoshis: 0 }));
      tx.fee(metanetNode.partFees[i]);
      tx.sign(parentKey.privateKey);

      console.log(`\tSending Bcat part [${bcatTxIds.length}] tx id: ${tx.id}`);
      const response = await this.send(tx);
      if (response.txid) {
        bcatTxIds.push(response.txid);
      }
    }

    return bcatTxIds;
  }

  /**
   * 
   * @param masterKey 
   * @param fundingTxId 
   * @param metanetNode Must have parent set with parent.derivationPath and parent.nodeAddress
   * @param payload 
   */
  static async createTx(masterKey: any, 
                        fundingTxId: string | null, 
                        metanetNode: MetanetNode,
                        payload: (string | Buffer)[]) {
    if (!metanetNode.parent) {
      throw new Error(`MetanetNode must have parent set: ${metanetNode.name}`);
    }

    const parentKey = masterKey.deriveChild(metanetNode.parent.derivationPath);
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
      while (!(utxo = await this.findUtxoByFee(metanetNode.parent, fundingTxId, metanetNode.fee))) {
        console.log(`Waiting for UTXO for key: ${metanetNode.parent.nodeAddress}, txid: ${fundingTxId}, fee: ${metanetNode.fee}`);
        await this.sleep(1000);
      }
      console.log(`Using utxo with vout: ${utxo.vout} from address: ${metanetNode.parent.nodeAddress}`);
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

  static async fileTx(masterKey: any, fundingTxId: string | null, metanetNode: MetanetNode, data: Buffer | string) {
    const payload = BProtocol.from(data, metanetNode.name, ' ', ' ');
    return this.createTx(masterKey, fundingTxId, metanetNode, payload);
  }

  static async fileDummyTx(masterKey: any, metanetNode: MetanetNode, data: Buffer | string) {
    return this.fileTx(masterKey, null, metanetNode, data);
  }

  static async folderTx(masterKey: any, fundingTxId: string | null, metanetNode: MetanetNode) {
    const payload = DirectoryProtocol.from(metanetNode.name);
    return this.createTx(masterKey, fundingTxId, metanetNode, payload);
  }

  static async folderDummyTx(masterKey: any, metanetNode: MetanetNode) {
    return this.folderTx(masterKey, null, metanetNode);
  }

  static async bcatTx(masterKey: any, fundingTxId: string | null, metanetNode: MetanetNode, partTxIds: string[]) {
    const payload = BcatProtocol.from(partTxIds, metanetNode.name, ' ', ' ');
    return this.createTx(masterKey, fundingTxId, metanetNode, payload);
  }

  static async bcatDummyTx(masterKey: any, metanetNode: MetanetNode, partTxIds: string[]) {
    return this.bcatTx(masterKey, null, metanetNode, partTxIds);
  }

  /**
   * Find all of the utxos for the derivation path and create a transaction which sends them to toAddress.
   */
  static async refundTx(masterKey: any, derivationPath: string, toAddress: string): Promise<any> {
    const fromAddress = this.addressForDerivationPath(masterKey, derivationPath);
    const utxos       = await this.bitindex.address.getUtxos(fromAddress);
    const balance     = utxos.map((utxo: any) => utxo.satoshis).reduce((sum: number, balance: number) => sum + balance);
    const estimateTx  = new bsv.Transaction().from([utxos]).to(toAddress, balance);
    const fee         = this.estimateFee(estimateTx);
    const tx          = new bsv.Transaction().from([utxos]).to(toAddress, balance - fee).fee(fee).sign(masterKey.deriveChild(derivationPath).privateKey);

    return tx;
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
    await this.waitForTransactionToAppear(fundingTxId);

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
   * Wait for TX to appear.
   * @param fundingTx
   */
  static async waitForTransactionToAppear(txId: string) {
    console.log(`Waiting for transaction to appear on network... (tx id: ${txId})`);
    while (!(await this.bitindex.tx.get(txId)).txid) {
      await this.sleep(1000);
    }
  }

  static async waitForTransactionToAppearOnPlanaria(txId: string) {
    console.log(`Waiting for transaction to appear on Planaria... (tx id: ${txId})`);
    while (!await this.getMetanetNode(txId)) {
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

  /**
   * Returns the funds remaining in an address in sats.
   * @param address 
   */
  static async addressBalance(address: string): Promise<number> {
    const response = await this.bitindex.address.getStatus(address);
    if (response.balanceSat !== undefined) {
      return response.balanceSat + response.unconfirmedBalanceSat;
    } else {
      console.log(response);
      throw new Error(JSON.stringify(response, null, 2));
    }
  }

  static addressForDerivationPath(masterKey: any, derivationPath: string) {
    return masterKey.deriveChild(derivationPath).publicKey.toAddress().toString();
  }

  static async sleep(ms: number) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
  }

}