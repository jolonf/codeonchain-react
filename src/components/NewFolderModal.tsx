

import React from "react";

import bsv from 'bsv';
import MoneyButton from '@moneybutton/react-money-button';

import './Modal.css';
import '../theme/variables.scss';
import { Metanet } from "../metanet/metanet";
import { IonButton } from "@ionic/react";
import { MetanetNode } from "../metanet/metanet_node";
import { MasterKeyStorage } from "../storage/MasterKeyStorage";

interface NewFolderProps {
  isOpen: boolean;
  onClose: Function;
  parent: MetanetNode;
}

class NewFolderModal extends React.Component<NewFolderProps> {

  state = {
    xprivkey: '',
    folderName: '',

    moneyButtonDisabled: true,
    moneyButtonProps: {} as any,

    message: ''
  }

  componentDidUpdate(prevProps: NewFolderProps) {
    // Check if there is an existing master key each time modal is opened
    if (this.props.isOpen && !prevProps.isOpen) {
      const masterKeyEntry = MasterKeyStorage.getMasterKey(this.props.parent.nodeAddress);

      if (masterKeyEntry) {
        this.setState({xprivkey: masterKeyEntry.masterKey});
      } else {
        console.log('MasterKey entry not found in local storage');
      }
    }
  }

  render() {
    if (!this.props.isOpen) {
      return null;
    }

    return (
      <div id="overlay" onClick={() => this.props.onClose()}>
        <div id="dialog" onClick={(e) => {e.stopPropagation()}}>
          <h2 style={{marginTop: 0}}>New Folder</h2>
          <hr />
          <div className='form-grid'>
                <div className='label'>Master key: </div>
                <div><input type='text' id='repo-master-key' value={this.state.xprivkey} onChange={(e) => this.onMasterKeyChanged(e)} size={64} placeholder='Enter the master key for this repository' /></div>

                <div className='label'>Name: </div>
                <div><input type='text' id='repo-name' onChange={(e) => this.onFolderNameChanged(e)} required placeholder='Folder name (Required)' size={80} /></div>
          </div>
          <div id='buttons'>
            <div>
              <IonButton onClick={() => this.props.onClose()} >Close</IonButton>
              <IonButton onClick={() => this.generateOutputs()} color='success'>Create Folder</IonButton>
            </div>

            {!this.state.moneyButtonDisabled && 
              (
                <div id='dialog-money-button-container'>
                  <p>
                    Swipe Money Button to create folder:
                  </p>
                  <div id='money-button-encapsulator'>
                    <MoneyButton 
                      disabled={this.state.moneyButtonDisabled}
                      label='Create'
                      successMessage='Funded'
                      buttonId={this.state.folderName}
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

  componentDidMount() {
    this.setState({moneyButtonDisabled: true});
  }

  onMasterKeyChanged(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({xprivkey: e.target.value});
    this.setState({moneyButtonDisabled: true});
    if (!Metanet.validateMasterKey(this.state.xprivkey, this.props.parent)) {
      console.log('Incorrect Master Key');
    }
  }

  onFolderNameChanged(e: React.ChangeEvent<HTMLInputElement>) {
    console.log('name changed')
    this.setState({folderName: e.target.value});
    this.setState({moneyButtonDisabled: true});
  }

  async generateOutputs() {
    console.log('generate outputs');
    const moneyButtonProps = this.state.moneyButtonProps;
    let moneyButtonDisabled = true;

    if (this.state.folderName && this.state.xprivkey) {
      // Transaction will create the root node as well as fund the root
      // so that the .bsvignore and bsvpush.json files can be created
      const masterKey = bsv.HDPrivateKey(this.state.xprivkey);

      const metanetNode = new MetanetNode();
      metanetNode.name = this.state.folderName;
      metanetNode.parentTxId = this.props.parent.nodeTxId;
      metanetNode.derivationPath = this.props.parent.nextFreeDerivationPath();

      const folderTx = await Metanet.folderDummyTx(masterKey, this.props.parent, metanetNode);

      const folderFee = folderTx.getFee() / 1e8;

      const parentAddress = this.props.parent.nodeAddress; //masterKey.deriveChild(this.props.parent.derivationPath).publicKey.toAddress().toString();

      console.log('Parent derivation path: ' + this.props.parent.derivationPath);
      console.log('Sending funds to parent address: ' + parentAddress);

      const outputs = [
        {
          "to": parentAddress, // Parent funds children
          "amount": folderFee,
          "currency": "BSV"
        }
      ];

      moneyButtonDisabled = false;
      moneyButtonProps.outputs = outputs;
    }
    this.setState({moneyButtonDisabled, moneyButtonProps});
  }

  async onPayment(arg: any) {
    console.log('on payment');
    const fundingTxId = arg.txid;
    console.log('funding txid: ' + fundingTxId);
    const masterKey = bsv.HDPrivateKey(this.state.xprivkey);

    const metanetNode = new MetanetNode();
    metanetNode.name = this.state.folderName;
    metanetNode.parentTxId = this.props.parent.nodeTxId;
    metanetNode.derivationPath = this.props.parent.nextFreeDerivationPath();

    const folderTx = await Metanet.folderTx(
      masterKey, 
      fundingTxId,
      this.props.parent,
      metanetNode);

    console.log(`Sending folder transaction: ${folderTx.id}`);
    await Metanet.send(folderTx);

    console.log(`Folder created, view here https://codeonchain.network/tx/${folderTx.id}`); 
    this.setState({message: `Folder created, view here https://codeonchain.network/tx/${folderTx.id}`});
  }

  onError(arg: any) {
    console.log('Error', arg);
  }

}

export default NewFolderModal;