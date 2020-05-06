

import React from "react";

import bsv from 'bsv';
import MoneyButton from '@moneybutton/react-money-button';

import '../theme/variables.scss';
import './Modal.css';
import { Metanet } from "../metanet/metanet";
import { DirectoryProtocol } from '../protocols/directory.protocol';
import { DerivationPathProtocol } from '../protocols/derivation-path.protocol';
import { IonButton, IonCheckbox } from "@ionic/react";
import { MetanetNode } from "../metanet/metanet-node";
import { RouteComponentProps, withRouter, Switch, Route } from "react-router";
import { RepoProtocol } from "../protocols/repo.protocol";
import { MetanetProtocol } from "../protocols/metanet.protocol";
import { AttributionProtocol } from "../protocols/attribution.protocol";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import Modal from "./Modal";
import EditAttribution from "./EditAttribution";
import { Attribution } from "../storage/attribution";
import { NewRepoModalContext, AttributionsContext, MasterKeysContext } from "../App";

interface NewRepoProps extends RouteComponentProps {
  onClose: Function;
  context: NewRepoModalContext;
  attributions: AttributionsContext;
  masterKeys: MasterKeysContext;
}

class NewRepoModal extends React.Component<NewRepoProps> {

  state = {
    message: '',
    moneyButtonProps: {} as any
  };

  componentDidMount() {
    if (!this.props.context.xprv) {
      this.props.context.setXprv(bsv.HDPrivateKey().xprivkey);
    }
  }

  render() {
    const createRepoButtonDisabled = !(this.props.context.xprv && this.props.context.name);
    return (
      <>
      <div id="overlay" onClick={() => this.props.onClose()}>
        <div id="dialog" onClick={(e) => {e.stopPropagation()}}>
          <h2 style={{marginTop: 0}}>New Repository</h2>
          <hr />
          <fieldset className='form-group'>
            <legend>Required</legend>
            <div className='form-grid'>

              <div className='label'>Master key: </div>
              <div><input type='text' id='repo-master-key' size={64} onChange={e => this.onMasterKeyChanged(e)} defaultValue={this.props.context.xprv} /></div>
              <div/>
              <div><IonCheckbox checked={this.props.context.storeMasterKey} id='store-master-key' onIonChange={(e) => this.onStoreMasterKeyChanged(e)}/><label htmlFor='store-master-key'> Store master key in local storage.</label><br/>
              <span className='input-note'>You must keep a copy of the master key to be able to make future changes to the repo.</span></div>
              
              <div className='label'>Repository Name: </div>
              <div><input type='text' id='repo-name' defaultValue={this.props.context.name} onChange={(e) => this.onRepoNameChanged(e)} required placeholder='' size={80} /></div>

            </div>
          </fieldset>

          <fieldset className='form-group'>
          <legend>Optional</legend>
            <div className='form-grid'>
              
              <div className='label'>Description: </div>
              <div><input type='text' id='repo-description' defaultValue={this.props.context.description} onChange={(e) => this.onDescriptionChanged(e)} placeholder='' size={80} /></div>
              
              <div className='label'>Website: </div>
              <div><input type='text' id='repo-website' defaultValue={this.props.context.website} onChange={(e) => this.onWebsiteChanged(e)} placeholder='' size={80} /></div>
                         
              <div className='label'>GitHub: </div>
              <div><input type='text' id='repo-github' defaultValue={this.props.context.gitHub} onChange={(e) => this.onGitHubChanged(e)} placeholder='e.g. http://github.com/<username>' size={80} /></div>

              <div className='label hidden'>Hidden: </div>
              <div className='hidden'><IonCheckbox id='repo-hidden' checked={this.props.context.hidden} onIonChange={(e) => this.onHiddenChanged(e)} /><label className='checkbox-input' htmlFor='repo-hidden'> Hide from listing on Codeonchain</label></div>

            </div>
          </fieldset>
          <div className='upload-buttons'>
            <div className='attribution-container'>
              <IonButton href={`${this.props.match.url}/attribution`} className='attribution-button' color='dark' fill='outline' disabled={false}>Attribution...</IonButton>
            </div>
            <div>
              <IonButton onClick={() => this.onClose()}>Close</IonButton>
              <IonButton onClick={() => this.generateOutputs()} color='success' disabled={createRepoButtonDisabled}>Create Repo</IonButton>
            </div>
          </div> 
          <div id='buttons'>

            {this.state.moneyButtonProps.outputs && 
              (
                <div id='dialog-money-button-container'>
                  <p>
                    Swipe Money Button to create repo:
                  </p>
                  <div id='money-button-encapsulator'>
                    <MoneyButton 
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
          </div>
        </div>
      </div>
      <TransitionGroup>
        <CSSTransition key={this.props.location.key} classNames='fade' timeout={300}>
          <Switch location={this.props.location}>
            <Route path={`${this.props.match.path}/attribution`} render={() => (
              <Modal title='Edit Attribution' onClose={() => this.props.history.push(this.props.match.url)}>
                <EditAttribution onClose={() => this.props.history.push(this.props.match.url)} onAttributions={(a: Attribution[]) => this.onAttributions(a)} />
              </Modal>
            )}/>
          </Switch>
        </CSSTransition>
      </TransitionGroup>
      </>
    );
  }

  onMasterKeyChanged(e: React.ChangeEvent<HTMLInputElement>) {
    this.props.context.setXprv(e.target.value);
    this.setState({moneyButtonProps: {}});
  }

  onStoreMasterKeyChanged(e: any) {
    this.setState({storeMasterKey: e.target.value === 'on'});
    if (e.target.value === 'on') {
      if (!window.localStorage) {
        alert('Local storage not available!');
      }
    }
  }
  
  onRepoNameChanged(e: React.ChangeEvent<HTMLInputElement>) {
    this.props.context.setName(e.target.value);
    this.setState({moneyButtonProps: {}});
  }

  onDescriptionChanged(e: React.ChangeEvent<HTMLInputElement>) {
    this.props.context.setDescription(e.target.value);
    this.setState({moneyButtonProps: {}});
  }

  onWebsiteChanged(e: React.ChangeEvent<HTMLInputElement>) {
    this.props.context.setWebsite(e.target.value);
    this.setState({moneyButtonProps: {}});;
  }

  onGitHubChanged(e: React.ChangeEvent<HTMLInputElement>) {
    this.props.context.setGitHub(e.target.value);
    this.setState({moneyButtonProps: {}});
  }

  onHiddenChanged(e: any) {
    this.props.context.setHidden(e.target.value);
    this.setState({moneyButtonProps: {}});
  }

  onAttributions(attributions: Attribution[]) {
    this.props.attributions.setAttributions(attributions);
    this.props.history.push(this.props.match.url);
  }

  onClose() {
    this.props.context.setXprv('');
    this.props.onClose();
  }

  async generateOutputs() {
    const moneyButtonProps = this.state.moneyButtonProps;

    if (this.props.context.name) {
      // Transaction will create the root node as well as fund the root
      // so that the .bsvignore and bsvpush.json files can be created
      const masterKey = bsv.HDPrivateKey(this.props.context.xprv);
      const rootNode = new MetanetNode(masterKey, 'm/0', this.props.context.name);

      rootNode.attributions = this.props.attributions.attributions;

      const repoProtocol = new RepoProtocol();
      repoProtocol.name = this.props.context.name;
      repoProtocol.description = this.props.context.description;
      repoProtocol.website = this.props.context.website;
      repoProtocol.github = this.props.context.gitHub;
      repoProtocol.hidden = this.props.context.hidden;

      const opReturnPayload = [
        ...MetanetProtocol.toASM(rootNode.nodeAddress, 'NULL'), 
        '|',
        ...repoProtocol.toASM(),
        '|',
        ...DirectoryProtocol.toASM(this.props.context.name),
        '|',
        ...DerivationPathProtocol.toASM(rootNode.derivationPath),
        ...rootNode.attributions.map(a => ['|', ...AttributionProtocol.toASM(a)]).flat(1)
      ];
  
      const outputs = [
        {
          "type": "SCRIPT",
          "script": ['OP_FALSE', 'OP_RETURN', ...Metanet.arrayToHexStrings(opReturnPayload)].join(' '),
          "amount": "0",
          "currency": "BSV"
        }
      ];

      moneyButtonProps.outputs = outputs;
    }
    this.setState({moneyButtonProps});
  }

  async onPayment(arg: any) {
    const fundingTxId = arg.txid;
    console.log('funding/parent txid: ' + fundingTxId);
    this.setState({moneyButtonProps: {}});

    if (this.props.context.storeMasterKey) {
      this.props.masterKeys.storeMasterKey(this.props.context.xprv, fundingTxId, this.props.context.name);
    }

    console.log(`Repo created, view here https://codeonchain.network/tx/${fundingTxId}`);   
    this.setState({message: `Waiting for transaction to appear...`});  
    await Metanet.waitForTransactionToAppearOnPlanaria(fundingTxId);
    this.setState({message: `Repo created, loading...`});   

    this.props.context.setXprv('');
    this.props.history.push(`/tx/${fundingTxId}`);
  }

  onError(arg: any) {
    console.log('Error', arg);
  }

}

export default withRouter<NewRepoProps>(NewRepoModal);