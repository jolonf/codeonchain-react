

import React from "react";

import bsv from 'bsv';
import MoneyButton from '@moneybutton/react-money-button';

import './Modal.css';
import '../theme/variables.scss';
import { Metanet } from "../metanet/metanet";
import { IonButton } from "@ionic/react";
import { MetanetNode } from "../metanet/metanet-node";
import { MasterKeyStorage } from "../storage/master-key-storage";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import { Switch, Route, RouteComponentProps, withRouter } from "react-router";
import Modal from "./Modal";
import EditAttribution from "./EditAttribution";
import { Attribution } from "../storage/attribution";
import { NewFolderModalContext, AttributionsContext } from "../App";

interface NewFolderProps extends RouteComponentProps {
  onClose: Function;
  onFolderCreated: Function;
  parent: MetanetNode;
  context: NewFolderModalContext;
  attributions: AttributionsContext;
}

class NewFolderModal extends React.Component<NewFolderProps> {

  state = {
    xprivkey: '',

    moneyButtonDisabled: true,
    moneyButtonProps: {} as any,

    message: ''

    //attributions: []
  }

  metanetNode = null as MetanetNode | null;

  returnLocation = null as Location | null;

  render() {
    return (
      <>
        <div id="overlay" onClick={() => this.props.onClose()}>
          <div id="dialog" onClick={(e) => {e.stopPropagation()}}>
            <h2 style={{marginTop: 0}}>New Folder</h2>
            <hr />
            <div className='form-grid'>
                  <div className='label'>Master key: </div>
                  <div><input type='text' id='repo-master-key' value={this.state.xprivkey} onChange={(e) => this.onMasterKeyChanged(e)} size={64} placeholder='Enter the master key for this repository' /></div>

                  <div className='label'>Name: </div>
                  <div><input type='text' id='repo-name' defaultValue={this.props.context.name} onChange={(e) => this.onFolderNameChanged(e)} required placeholder='Folder name (Required)' size={80} /></div>
            </div>
            <div className='upload-buttons'>
              <div className='attribution-container'>
                <IonButton href={`${this.props.match.url}/attribution`} className='attribution-button' color='dark' fill='outline' disabled={false}>Attribution...</IonButton>
              </div>
              <div>
                <IonButton onClick={() => this.props.onClose()} >Close</IonButton>
                <IonButton onClick={() => this.generateOutputs()} color='success' disabled={!this.props.context.name}>Create Folder</IonButton>
              </div>
              <div className='empty-space' />
            </div>
            {(this.state.moneyButtonProps.outputs || this.state.message) &&
            <div id='buttons'>

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
                        buttonId={this.props.context.name}
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
            </div>}
          </div>
        </div>
        <TransitionGroup>
          <CSSTransition key={this.props.location.key} classNames='fade' timeout={300}>
            <Switch location={this.props.location}>
              <Route path={`${this.props.match.path}/attribution`} render={() => (
                <Modal title='Edit Attribution' onClose={() => this.props.history.push(this.props.match.url)}>
                  <EditAttribution onClose={() => this.props.history.push(this.props.match.url)} onAttributions={a => this.onAttributions(a)} />
                </Modal>
              )}/>
            </Switch>
          </CSSTransition>
        </TransitionGroup>

      </>
    );
  }

  async componentDidMount() {
    this.setState({moneyButtonDisabled: true});
    this.getMasterKeyFromStorage();
  }

  async componentDidUpdate(prevProps: NewFolderProps) {
    if (prevProps.parent !== this.props.parent) {
      this.getMasterKeyFromStorage();
    }
  }

  async getMasterKeyFromStorage() {
    const masterKeyEntry = await MasterKeyStorage.getMasterKeyEntryForChild(this.props.parent);
    if (masterKeyEntry) {
      this.setState({xprivkey: masterKeyEntry.masterKey});
    } else {
      console.log('MasterKey entry not found in local storage');
    }
  }

  onMasterKeyChanged(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({xprivkey: e.target.value});
    this.setState({moneyButtonDisabled: true});
    if (!Metanet.validateMasterKey(this.state.xprivkey, this.props.parent)) {
      console.log('Incorrect Master Key');
    }
  }

  onFolderNameChanged(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({moneyButtonDisabled: true});
    this.props.context.setName(e.target.value);
  }

  onAttributions(a: Attribution[]) {
    //console.log('onAttributions: ' + this.props.match.url);
    this.props.attributions.setAttributions(a);
    this.props.history.push(this.props.match.url);
  }

  async generateOutputs() {
    const moneyButtonProps = this.state.moneyButtonProps;
    let moneyButtonDisabled = true;

    if (this.props.context.name && this.state.xprivkey) {
      // Transaction will create the root node as well as fund the root
      // so that the .bsvignore and bsvpush.json files can be created
      const masterKey = bsv.HDPrivateKey(this.state.xprivkey);
      this.metanetNode = this.props.parent.childOrCreate(this.props.context.name, masterKey);
      this.metanetNode.attributions = this.props.attributions.attributions;
      const folderTx = await Metanet.folderDummyTx(masterKey, this.metanetNode);
      const folderFee = folderTx.getFee() / 1e8;
      const parentAddress = this.props.parent.nodeAddress; //masterKey.deriveChild(this.props.parent.derivationPath).publicKey.toAddress().toString();
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
    const fundingTxId = arg.txid;
    console.log('funding txid: ' + fundingTxId);
    this.setState({moneyButtonProps: {}});
    if (this.metanetNode) {
      this.props.parent.spentVouts = [];
      const masterKey = bsv.HDPrivateKey(this.state.xprivkey);
      const folderTx = await Metanet.folderTx(masterKey, fundingTxId, this.metanetNode);

      console.log(`Sending folder transaction: ${folderTx.id}`);
      const response = await Metanet.send(folderTx);

      this.setState({message: `Waiting for transaction to appear...`});
      await Metanet.waitForTransactionToAppearOnPlanaria(response.txid);

      this.setState({message: `Folder added`});
      this.props.onFolderCreated();
    }
  }

  onError(arg: any) {
    console.log('Error', arg);
  }

}

export default withRouter(NewFolderModal);