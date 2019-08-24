

import React from "react";

import bsv from 'bsv';
import MoneyButton from '@moneybutton/react-money-button';

import '../theme/variables.scss';
import './Modal.css';
import { Metanet, METANET_FLAG } from "../metanet/metanet";
import { DirectoryProtocol } from '../protocols/directory.protocol';
import { DerivationPathProtocol } from '../protocols/derivation_path.protocol';
import { IonButton } from "@ionic/react";
import { MetanetNode } from "../metanet/metanet_node";
import { MasterKeyStorage } from "../storage/MasterKeyStorage";
import { RouteComponentProps, withRouter } from "react-router";

interface NewRepoProps extends RouteComponentProps {
  onClose: Function;
}

class NewRepoModal extends React.Component<NewRepoProps> {

  state = {
    message: '',
    masterKey: bsv.HDPrivateKey(),
    storeMasterKey: true,
    repoName: '',
    description: '',
    author: '',
    version: '',
    sponsor: '',
    hidden: false,
    moneyButtonDisabled: true,
    moneyButtonProps: {} as any,
    createRepoButtonDisabled: true
  };

  bsvignoreData = '';
  bsvpushData = '';
  bsvignoreNode = new MetanetNode(this.state.masterKey, 'm/0/0', '.bsvignore');
  bsvpushNode = new MetanetNode(this.state.masterKey, 'm/0/1', 'bsvpush.json');

  componentDidMount() {
    const masterKey = bsv.HDPrivateKey();

    this.bsvignoreNode = new MetanetNode(masterKey, 'm/0/0', '.bsvignore');
    this.bsvpushNode = new MetanetNode(masterKey, 'm/0/1', 'bsvpush.json');
  
    this.setState({
      moneyButtonDisabled: true,
      createRepoButtonDisabled: true,
      masterKey: masterKey
    });
  }

  render() {
    return (
      <div id="overlay" onClick={() => this.props.onClose()}>
        <div id="dialog" onClick={(e) => {e.stopPropagation()}}>
          <h2 style={{marginTop: 0}}>New Repository</h2>
          <hr />
          <fieldset className='form-group'>
            <legend>Required</legend>
            <div className='form-grid'>
              <div className='label'>Master key: </div>
              <div><input type='text' id='repo-master-key' size={64} readOnly value={this.state.masterKey.xprivkey} /><br />
              <label><input type='checkbox' defaultChecked={this.state.storeMasterKey} id='store-master-key' onChange={(e) => this.onStoreMasterKeyChanged(e)}/> Store master key in local storage.</label><br/>
              <span className='input-note'>You must keep a copy of the master key to be able to make future changes to the repo.</span></div>
              
              <div className='label'>Repository Name: </div>
              <div><input type='text' id='repo-name' onChange={(e) => this.onRepoNameChanged(e)} required placeholder='' size={80} /></div>

            </div>
          </fieldset>

          <fieldset className='form-group'>
          <legend>Optional</legend>
            <div className='form-grid'>
              
              <div className='label'>Description: </div>
              <div><input type='text' id='repo-description' onChange={(e) => this.onDescriptionChanged(e)} placeholder='' size={80} /></div>
              
              <div className='label'>Author: </div>
              <div><input type='text' id='repo-author' onChange={(e) => this.onAuthorChanged(e)} placeholder='' size={80} /></div>
              
              <div className='label'>Version: </div>
              <div><input type='text' id='repo-version' onChange={(e) => this.onVersionChanged(e)} defaultValue='0.0.1' size={80} /></div>
              
              <div className='label'>Sponsor: </div>
              <div><input type='text' id='repo-sponsor' onChange={(e) => this.onSponsorChanged(e)} placeholder='Paymail, BSV address, or MoneyButton id (Optional)' size={80} /></div>
              
              <div className='label hidden'>Hidden: </div>
              <div className='hidden'><label className='checkbox-input'><input type='checkbox' id='repo-hidden' onChange={(e) => this.onHiddenChanged(e)} /> Hide from listing on Codeonchain</label></div>

            </div>
          </fieldset>

          <div id='buttons'>
            <div>
              <IonButton onClick={() => this.props.onClose()}>Close</IonButton>
              <IonButton onClick={() => this.generateOutputs()} color='success' disabled={this.state.createRepoButtonDisabled}>Create Repo</IonButton>
            </div>
            {!this.state.moneyButtonDisabled && 
              (
                <div id='dialog-money-button-container'>
                  <p>
                    Swipe Money Button to create repo:
                  </p>
                  <div id='money-button-encapsulator'>
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
            {this.state.message &&
            <p>
              {this.state.message}
            </p>}
          </div>
        </div>
      </div>
    );
  }

  onStoreMasterKeyChanged(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({storeMasterKey: e.target.value === 'on'});
    if (e.target.value === 'on') {
      if (!window.localStorage) {
        alert('Local storage not available!');
      }
    }
  }
  onRepoNameChanged(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({repoName: e.target.value});
    this.setState({moneyButtonDisabled: true});
    this.setState({createRepoButtonDisabled: !e.target.value});
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
    const moneyButtonProps = this.state.moneyButtonProps;
    let moneyButtonDisabled = true;

    if (this.state.repoName) {
      // Transaction will create the root node as well as fund the root
      // so that the .bsvignore and bsvpush.json files can be created
      const rootNode = new MetanetNode(this.state.masterKey, 'm/0', this.state.repoName);

      this.bsvignoreData = `.bsvpush\n.git`;
      this.bsvpushData = JSON.stringify({
        name: this.state.repoName,
        description: this.state.description,
        author: this.state.author,
        version: this.state.version,
        sponsor: {to: this.state.sponsor},
        hidden: this.state.hidden,
        test: true
      }, null, 2);
      this.bsvignoreNode.parent = rootNode;
      this.bsvpushNode.parent = rootNode;

      // We aren't sending these transactions yet, just estimating the size to fund the parent
      await Metanet.fileDummyTx(this.state.masterKey, this.bsvignoreNode, this.bsvignoreData);
      await Metanet.fileDummyTx(this.state.masterKey, this.bsvpushNode, this.bsvpushData);

      const opReturnPayload = [
        METANET_FLAG,
        rootNode.nodeAddress,
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
          "to": rootNode.nodeAddress, // Root funds children
          "amount": this.bsvignoreNode.fee / 1e8,
          "currency": "BSV"
        },
        {
          "to": rootNode.nodeAddress, // Root funds children
          "amount": this.bsvpushNode.fee / 1e8,
          "currency": "BSV"
        }
      ];

      moneyButtonDisabled = false;
      moneyButtonProps.outputs = outputs;
    }
    this.setState({moneyButtonDisabled, moneyButtonProps});
  }

  async onPayment(arg: any) {
    this.setState({message: 'Initialising repo...'});
    const fundingTxId = arg.txid;
    console.log('funding/parent txid: ' + fundingTxId);

    if (this.state.storeMasterKey) {
      MasterKeyStorage.storeMasterKey(this.state.masterKey, fundingTxId, this.state.repoName);
    }

    const rootNode = new MetanetNode(this.state.masterKey, 'm/0', this.state.repoName);

    this.bsvignoreNode.parentTxId = fundingTxId;
    this.bsvignoreNode.parent = rootNode;
    this.bsvpushNode.parentTxId = fundingTxId;
    this.bsvpushNode.parent = rootNode;

    const bsvignoreTx = await Metanet.fileTx(this.state.masterKey, fundingTxId, this.bsvignoreNode, this.bsvignoreData);
    const bsvpushTx = await Metanet.fileTx(this.state.masterKey, fundingTxId, this.bsvpushNode, this.bsvpushData);

    console.log(`Sending .bsvignore transaction: ${bsvignoreTx.id}`);
    await Metanet.send(bsvignoreTx);
    console.log(`Sending bsvpush.json transaction: ${bsvpushTx.id}`);
    await Metanet.send(bsvpushTx);

    console.log(`Repo created, view here https://codeonchain.network/tx/${fundingTxId}`);   
    this.setState({message: `Repo created, loading...`});   
    //window.location.href = `/tx/${fundingTxId}`;
    this.props.history.push(`/tx/${fundingTxId}`);
  }

  onError(arg: any) {
    console.log('Error', arg);
  }

}

export default withRouter<NewRepoProps>(NewRepoModal);