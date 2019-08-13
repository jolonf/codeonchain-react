

import React from "react";

import bsv from 'bsv';
import MoneyButton from '@moneybutton/react-money-button';

import './NewRepoModal.css';
import '../theme/variables.scss';
import { Metanet, METANET_FLAG } from "../metanet/metanet";
import { DirectoryProtocol } from '../protocols/directory.protocol';
import { DerivationPathProtocol } from '../protocols/derivation_path.protocol';
import { IonButton } from "@ionic/react";
import { MetanetNode } from "../metanet/metanet_node";

interface NewRepoProps {
  isOpen: boolean;
  onClose: Function;
}

class NewRepoModal extends React.Component<NewRepoProps> {

  state = {
    message: '',
    masterKey: bsv.HDPrivateKey(),
    repoName: '',
    description: '',
    author: '',
    version: '',
    sponsor: '',
    hidden: false,
    moneyButtonDisabled: true,
    moneyButtonProps: {} as any,
    bsvignoreData: '',
    bsvpushData: ''
  }

  render() {
    if (!this.props.isOpen) {
      return null;
    }

    return (
      <div id="new-repo-overlay" onClick={() => this.props.onClose()}>
        <div id="new-repo-dialog" onClick={(e) => {e.stopPropagation()}}>
          <h2>New Repository</h2>
          <hr />
          <table>
            <tbody>
            <tr>
              <td>Master key: </td>
              <td><input type='text' id='repo-master-key' size={64} readOnly value={this.state.masterKey.xprivkey} /><br />
              <span className='input-note'>You must keep a copy of the master key to be able to make future changes to the repo.</span></td>
            </tr>    
            <tr>
              <td>Name: </td>
              <td><input type='text' id='repo-name' onChange={(e) => this.onRepoNameChanged(e)} required placeholder='Repository name (Required)' size={80} /></td>
            </tr>
            <tr>
              <td>Description: </td>
              <td><input type='text' id='repo-description' onChange={(e) => this.onDescriptionChanged(e)} placeholder='Repository description (Optional)' size={80} /></td>
            </tr>
            <tr>
              <td>Author: </td>
              <td><input type='text' id='repo-author' onChange={(e) => this.onAuthorChanged(e)} placeholder='Optional' size={80} /></td>
            </tr>
            <tr>
              <td>Version: </td>
              <td><input type='text' id='repo-version' onChange={(e) => this.onVersionChanged(e)} defaultValue='0.0.1' size={80} /></td>
            </tr>
            <tr>
              <td>Sponsor: </td>
              <td><input type='text' id='repo-sponsor' onChange={(e) => this.onSponsorChanged(e)} placeholder='Paymail, BSV address, or MoneyButton id' size={80} /></td>
            </tr>
            <tr>
              <td className='hidden'>Hidden: </td>
              <td className='hidden'><span className='checkbox-input'><input type='checkbox' id='repo-hidden' onChange={(e) => this.onHiddenChanged(e)} /> Hide from listing on Codeonchain</span></td>
            </tr>  
            </tbody>
          </table>
          <div id='new-repo-money-button-container'>
            <div>
              <IonButton onClick={() => this.generateOutputs()} color='success'>Create Repo</IonButton>
            </div>
            {!this.state.moneyButtonDisabled && 
              (
                <div>
                  <p>
                    Swipe Money Button to create repo:
                  </p>
                  <div>
                    <MoneyButton 
                      disabled={this.state.moneyButtonDisabled}
                      label='Create'
                      successMessage='Funded'
                      buttonId={this.state.repoName}
                      clientIdentifier='3fb24dea420791729b4d9b39703c6339'
                      type='buy'
                      onPayment={(args: any) => this.onPayment(args)}
                      onError={(args: any) => this.onError(args)}
                    {...this.state.moneyButtonProps} editable={false} />
                  </div>
                </div>
              )
            }
            <p>
              {this.state.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  componentDidMount() {
    this.setState({moneyButtonDisabled: true});
  }

/*  onChange(e: React.FormEvent<HTMLInputElement>) {
    console.log('on change');
    this.setState({moneyButtonDisabled: true});
  }
*/
  onRepoNameChanged(e: React.ChangeEvent<HTMLInputElement>) {
    console.log('name changed')
    this.setState({repoName: e.target.value});
    this.setState({moneyButtonDisabled: true});
  }
  onDescriptionChanged(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({description: e.target.value});
    this.setState({moneyButtonDisabled: true});
  }
  onAuthorChanged(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({author: e.target.value});
    this.setState({moneyButtonDisabled: true});
  }
  onVersionChanged(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({version: e.target.value});
    this.setState({moneyButtonDisabled: true});
  }
  onSponsorChanged(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({sponsor: e.target.value});
    this.setState({moneyButtonDisabled: true});
  }
  onHiddenChanged(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({hidden: e.target.value === 'on'});
    this.setState({moneyButtonDisabled: true});
  }

  async generateOutputs() {
    console.log('generate outputs');
    const moneyButtonProps = this.state.moneyButtonProps;
    let bsvpushData = '';
    let bsvignoreData = '';
    let moneyButtonDisabled = true;

    if (this.state.repoName) {
      // Transaction will create the root node as well as fund the root
      // so that the .bsvignore and bsvpush.json files can be created
      const rootKey = this.state.masterKey.deriveChild('m/0');
      const rootAddress = rootKey.publicKey.toAddress().toString();
      const rootNode = new MetanetNode();
      rootNode.nodeAddress = rootAddress;

      bsvignoreData = `.bsvpush\n.git`;
      bsvpushData = JSON.stringify({
        name: this.state.repoName,
        description: this.state.description,
        author: this.state.author,
        version: this.state.version,
        sponsor: {to: this.state.sponsor},
        hidden: this.state.hidden,
        test: true
      }, null, 2);

      // We aren't sending these transactions yet, just estimating the size to fund the parent
      const bsvignoreNode = new MetanetNode();
      bsvignoreNode.derivationPath = 'm/0/0';
      bsvignoreNode.name = '.bsvignore';
      const bsvpushNode = new MetanetNode();
      bsvpushNode.derivationPath = 'm/0/1';
      bsvpushNode.name = 'bsvpush.json';
      const bsvignoreTx = await Metanet.fileDummyTx(this.state.masterKey, rootNode, bsvignoreNode, bsvignoreData);
      const bsvpushTx = await Metanet.fileDummyTx(this.state.masterKey, rootNode, bsvpushNode, bsvpushData);

      const bsvignoreFee = bsvignoreTx.getFee() / 1e8;
      const bsvpushFee = bsvpushTx.getFee() / 1e8;

      const opReturnPayload = [
        METANET_FLAG,
        rootAddress,
        'NULL',
        '|',
        DirectoryProtocol.address,
        this.state.repoName,
        '|',
        DerivationPathProtocol.address,
        'm/0'
      ];

      const outputs = [
        {
          "type": "SCRIPT",
          "script": ['OP_FALSE', 'OP_RETURN', ...Metanet.arrayToHexStrings(opReturnPayload)].join(' '),
          "amount": "0",
          "currency": "BSV"
        },
        {
          "to": rootAddress, // Root funds children
          "amount": bsvignoreFee,
          "currency": "BSV"
        },
        {
          "to": rootAddress, // Root funds children
          "amount": bsvpushFee,
          "currency": "BSV"
        },
        {
          "to": 'codeonchainnetwork@moneybutton.com',
          "amount": 0.001,
          "currency": "BSV"
        }
      ];

      moneyButtonDisabled = false;
      moneyButtonProps.outputs = outputs;
    }
    this.setState({moneyButtonDisabled, moneyButtonProps, bsvignoreData, bsvpushData});
  }

  async onPayment(arg: any) {
    this.setState({message: 'Initialising repo...'});
    console.log('on payment');
    const fundingTxId = arg.txid;
    console.log('funding/parent txid: ' + fundingTxId);

    const rootKey = this.state.masterKey.deriveChild('m/0');
    const rootAddress = rootKey.publicKey.toAddress().toString();
    const rootNode = new MetanetNode();
    rootNode.nodeAddress = rootAddress;
    rootNode.nodeTxId = fundingTxId;

    const bsvignoreNode = new MetanetNode();
    bsvignoreNode.derivationPath = 'm/0/0';
    bsvignoreNode.name = '.bsvignore';
    bsvignoreNode.parentTxId = fundingTxId;

    const bsvpushNode = new MetanetNode();
    bsvpushNode.derivationPath = 'm/0/1';
    bsvpushNode.name = 'bsvpush.json';
    bsvpushNode.parentTxId = fundingTxId;

    const bsvignoreTx = await Metanet.fileTx(this.state.masterKey, fundingTxId, rootNode, bsvignoreNode, this.state.bsvignoreData);
    const bsvpushTx = await Metanet.fileTx(this.state.masterKey, fundingTxId, rootNode, bsvpushNode, this.state.bsvpushData);

    console.log(`Sending .bsvignore transaction: ${bsvignoreTx.id}`);
    await Metanet.send(bsvignoreTx);
    console.log(`Sending .bsvpush transaction: ${bsvpushTx.id}`);
    await Metanet.send(bsvpushTx);

    console.log(`Repo created, view here https://codeonchain.network?tx=${fundingTxId}`);   
    this.setState({message: `Repo created, view here https://codeonchain.network?tx=${fundingTxId}`});   
  }

  onError(arg: any) {
    console.log('Error', arg);
  }

}

export default NewRepoModal;