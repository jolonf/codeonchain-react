

import React from "react";

import bsv from 'bsv';
import MoneyButton from '@moneybutton/react-money-button';

import './Modal.css';
import './AddFilesModal.css';
import '../theme/variables.scss';
import { Metanet } from "../metanet/metanet";
import { FileTree } from "../metanet/FileTree"; 
import { FileTreeViewer } from './FileTreeViewer';
import { IonButton, IonIcon, IonProgressBar, IonCheckbox } from "@ionic/react";
import { MetanetNode } from "../metanet/metanet_node";
import { cloudUpload } from "ionicons/icons";
import { MasterKeyStorage } from "../storage/MasterKeyStorage";
import { RouteComponentProps, withRouter, Switch, Route } from "react-router";
import { TransitionGroup, CSSTransition } from "react-transition-group";

import EditAttribution from "./EditAttribution";
import Modal from "./Modal";

interface AddFilesProps extends RouteComponentProps {
  onClose: Function;
  onFilesAdded: Function;
  parent: MetanetNode;
}

class AddFilesModal extends React.Component<AddFilesProps> {

  state = {
    xprivkey: '',

    addFilesButtonDisabled: true,
    moneyButtonDisabled: true,
    moneyButtonProps: {} as any,

    message: '',

    dragHighlight: false,

    fileTrees: [] as FileTree[],

    progressBarValue: 0,
    progressBarIndeterminate: false
  }

  fileInput: HTMLInputElement | null = null;
  folderInput: HTMLInputElement | null = null;

  currentFileIndex = 0;
  maxFiles = 0;

  render() {

    const fileCount = this.countFiles(this.state.fileTrees);
    return (
      <>
        <div id="overlay" onClick={() => this.props.onClose()}>
          <div id="dialog" onClick={(e) => {e.stopPropagation()}}>
            <h2 style={{marginTop: 0}}>Add Files</h2>
            <hr />
            <div className='form-grid'>
                  <div className='label'>Master key: </div>
                  <div><input type='text' id='repo-master-key' value={this.state.xprivkey} onChange={(e) => this.onMasterKeyChanged(e)} size={64} placeholder='Enter the master key for this repository' /></div>
            </div>
            <div className='file-selection-container'>
              <div className={`file-drop-area ${this.state.dragHighlight ? 'drag-highlight': ''}`} onDragOver={(e) => this.onDragOver(e)} onDragLeave={() => this.onDragLeave()} onDrop={(e) => this.onDrop(e)}>
                <IonIcon icon={cloudUpload} color='medium' size='large' />
                <p id='drop-files-message'>Drop files here</p>
                <div id='select-files-button-container'>
                  <IonButton onClick={() => {this.fileInput!.click()}}>Select Files...</IonButton>
                  <IonButton onClick={() => {this.folderInput!.click()}}>Select Folder...</IonButton>
                  <input ref={ref => this.fileInput = ref} onChange={(e) => this.onFilesSelected(e)} id='hidden-file-input' type='file' multiple />
                  <input ref={ref => this.setFolderInputRef(ref)} onChange={(e) => this.onFolderSelected(e)} id='hidden-folder-input' type='file'  />
                </div>
                {this.state.fileTrees.length > 0 &&
                <p id='file-count'>
                  {`${fileCount} file${fileCount > 1 ? 's' : ''}`} selected
                </p>}
              </div>
            </div>
            <div className='attribution-container'>
              <IonCheckbox color='dark'/>  <IonButton href={`${this.props.match.url}/attribution`} color='dark' fill='outline' size='small' disabled={false}>Attribution...</IonButton>
            </div>
            {this.state.fileTrees.length > 0 &&
            <div className='file-trees-container'>
              <FileTreeViewer fileTrees={this.state.fileTrees} />
            </div>}
            <div id='buttons'>
              <div>
                <IonButton onClick={() => this.props.onClose()} >Close</IonButton>
                <IonButton onClick={() => this.onAddFilesButton()} disabled={this.state.addFilesButtonDisabled} color='success' >Add Files</IonButton>
              </div>

              {!this.state.moneyButtonDisabled && 
                (
                  <div id='dialog-money-button-container'>
                    <p>
                      Swipe Money Button to upload files:
                    </p>
                    <div id='money-button-encapsulator'>
                      <MoneyButton 
                        disabled={this.state.moneyButtonDisabled}
                        label='Create'
                        successMessage='Funded'
                        buttonId={this.props.parent.nodeTxId}
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
              {(this.state.progressBarValue > 0 || this.state.progressBarIndeterminate) &&
              <IonProgressBar value={this.state.progressBarValue} type={this.state.progressBarIndeterminate ? 'indeterminate' : 'determinate'}/>}
            </div>
          </div>
        </div>
        <TransitionGroup>
          <CSSTransition key={this.props.location.key} classNames='fade' timeout={300}>
            <Switch location={this.props.location}>
              <Route path={`${this.props.match.path}/attribution`} render={() => (
                <Modal title='Edit Attribution' onClose={() => this.props.history.push(this.props.match.url)}>
                  <EditAttribution onClose={() => this.props.history.push(this.props.match.url)} />
                </Modal>
              )}/>
            </Switch>
          </CSSTransition>
        </TransitionGroup>
      </>
    );
  }

  componentDidMount() {
    this.loadMasterKey();

    if (this.props.location.state && this.props.location.state.fileTrees) {
      console.log(this.props.location.state.fileTrees);
      this.setState({fileTrees: this.props.location.state.fileTrees});

      if (this.props.location.state.fileTrees.length > 0) {
        this.setState({addFilesButtonDisabled: false});
      }
    }

    this.setState({
      moneyButtonDisabled: true,
      message: '',
      progressBarValue: 0,
      progressBarIndeterminate: false
    });
  }

  componentDidUpdate(prevProps: AddFilesProps) {
    if (this.props.parent !== prevProps.parent) {
      this.loadMasterKey();
    }
  }

  async loadMasterKey() {
    if (this.props.parent.nodeAddress) {
      const masterKeyEntry = await MasterKeyStorage.getMasterKeyEntryForChild(this.props.parent);

      if (masterKeyEntry) {
        this.setState({xprivkey: masterKeyEntry.masterKey});
      } else {
        console.log('MasterKey entry not found in local storage');
      }  
    }
  }

  /**
   * Hack to get around TypeScript not supporting the webkitdirectory directly in JSX.
   * @param ref 
   */
  setFolderInputRef(ref: HTMLInputElement | null) {
    if (ref) {
      this.folderInput = ref;
      this.folderInput.setAttribute('webkitdirectory', 'true');
    }
  }

  onMasterKeyChanged(e: React.ChangeEvent<HTMLInputElement>) {
    const xprv = e.target.value;
    this.setState({xprivkey: xprv});
    this.setState({moneyButtonDisabled: true});

    if (xprv && xprv.startsWith('xprv') && this.state.fileTrees.length > 0) {
      this.setState({addFilesButtonDisabled: false});
    }
  }

  onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    this.setState({dragHighlight: true});
  }

  onDragLeave() {
    this.setState({dragHighlight: false});
  }

  async onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.stopPropagation();
    e.preventDefault();
    this.setState({dragHighlight: false});
    if (e.dataTransfer.items) {
      const fileTrees = await FileTree.itemListToFileTrees(e.dataTransfer.items);
      this.setState({
        fileTrees: fileTrees,
        moneyButtonDisabled: true
      });
      if (this.state.xprivkey) {
        this.setState({addFilesButtonDisabled: false});
      }
    }
  }

  async onFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    if (this.fileInput && this.fileInput.files) {
      const fileTrees = [] as FileTree[];
      for (let i = 0; i < this.fileInput.files.length; i++) {
        const file = this.fileInput.files[i];
        fileTrees.push(new FileTree(file.name, file));
      }
      this.setState({
        fileTrees: fileTrees,
        moneyButtonDisabled: true
      });
      if (this.state.xprivkey) {
        this.setState({addFilesButtonDisabled: false});
      }
    }
  }

  async onFolderSelected(e: React.ChangeEvent<HTMLInputElement>) {
    if (this.folderInput && this.folderInput.files) {
      this.setState({
        fileTrees: FileTree.fileListToFileTrees(this.folderInput.files),
        moneyButtonDisabled: true
      });
      if (this.state.xprivkey) {
        this.setState({addFilesButtonDisabled: false});
      }
    }
  }

  onAddFilesButton() {
    if (this.fileInput && this.fileInput.files) {
      this.setState({addFilesButtonDisabled: true});
      
      this.generateOutputs(this.state.fileTrees);
    }
  }

  countFiles(fileTrees: FileTree[]) {
    return fileTrees.length === 0 ? 0 : fileTrees.map(fileTree => fileTree.fileCount()).reduce((sum, count) => sum + count);
  }

  countTxs(fileTrees: FileTree[]) {
    return fileTrees.length === 0 ? 0 : fileTrees.map(fileTree => fileTree.txCount()).reduce((sum, count) => sum + count);
  }

  async generateOutputs(fileTrees: FileTree[]) {
    const moneyButtonProps = this.state.moneyButtonProps;
    let moneyButtonDisabled = true;

    if (this.state.xprivkey) {
      // Transaction will create the root node as well as fund the root
      // so that the .bsvignore and bsvpush.json files can be created
      const masterKey = bsv.HDPrivateKey(this.state.xprivkey);

      this.setState({message: 'Estimating fees...'});
      this.currentFileIndex = 0;
      this.maxFiles = this.countTxs(fileTrees);

      const fee = await Metanet.estimateFileTreesFee(masterKey, this.props.parent, fileTrees, (name: string) => this.onEstimateFeeStatus(name));

      console.log(`Fee: ${fee}`);

      const outputs = [] as any[];

      this.generateFundingOutputs(outputs, masterKey, this.props.parent, fileTrees);

      console.log('Money Button outputs', outputs);
      moneyButtonDisabled = false;
      moneyButtonProps.outputs = outputs;
    } else {
      this.setState({message: 'No master key!'});
    }
    this.setState({moneyButtonDisabled, moneyButtonProps, message: '', progressBarValue: 0});
  }

  onEstimateFeeStatus(name: string) {
    this.currentFileIndex++;
    //console.log(`Estimate fees status: ${name}`);
    this.setState({
      message: `Estimating fees: ${this.currentFileIndex} of ${this.maxFiles} transactions`,
      progressBarValue: this.currentFileIndex / this.maxFiles
    });
  }

  /**
   * Recurses through the FileTrees and generates Money Button outputs for each file/folder.
   * Each output pays the parent of the file/folder using the fee from the MetanetNode
   * calculated in Metanet.estimateFileTreesFee().
   * @param outputs Money Button outputs will be pushed to the end of this array.
   * @param masterKey 
   * @param parent Parent which will be funded
   * @param fileTrees 
   */
  generateFundingOutputs(outputs: any[], masterKey: any, parent: MetanetNode, fileTrees: FileTree[]) {
    for (const fileTree of fileTrees) {
      let metanetNode = parent.childWithName(fileTree.name);
      if (metanetNode) {
        const fee = metanetNode.fee;
        outputs.push({
          to: parent.nodeAddress,
          amount: fee / 1e8,
          currency: 'BSV'
        });
        metanetNode.partFees.forEach(fee => outputs.push({
          to: parent.nodeAddress,
          amount: fee / 1e8,
          currency: 'BSV'
        }));
        this.generateFundingOutputs(outputs, masterKey, metanetNode, fileTree.children);
      }
    }
  }

  /**
   * Once the MoneyButton payment has been made we can begin to send the files.
   * @param arg 
   */
  async onPayment(arg: any) {
    console.log('on payment');
    const fundingTxId = arg.txid;
    console.log('funding txid: ' + fundingTxId);

    // Hide the moneybutton
    this.setState({moneyButtonDisabled: true});

    await this.sendFiles(fundingTxId);
  }

  /**
   * First wait for the funding tx to be confirmed (if necessary) then send file txs.
   * @param fundingTxId 
   */
  async sendFiles(fundingTxId: string) {
    const masterKey = bsv.HDPrivateKey(this.state.xprivkey);

    this.setState({message: 'Sending files...'});
    this.currentFileIndex = 0;
    this.maxFiles = this.countTxs(this.state.fileTrees);

    try {
      this.setState({progressBarIndeterminate: true});
      await Metanet.waitForUnconfirmedParents(fundingTxId, (message: string) => this.onWaitForUnconfirmedParentsCallback(message));
      const txIds = await Metanet.sendFileTrees(masterKey, fundingTxId, this.props.parent, this.state.fileTrees, (name: string) => this.onSendFilesCallback(name));
      console.log('Files added, txIds: ', txIds); 
      this.setState({message: `Waiting for transaction to appear...`});
      await Metanet.waitForTransactionToAppearOnPlanaria(txIds[0]);
      this.setState({progressBarIndeterminate: false});
      this.setState({message: `Files Added`});
      this.props.onFilesAdded();
    } catch (error) {
      console.log('Error sending files', error); 
      this.setState({message: `Error: ${error}`});
      this.setState({progressBarIndeterminate: false});
    }
  }

  onWaitForUnconfirmedParentsCallback(message: string) {
    this.setState({message: message});
  }

  onSendFilesCallback(name: string) {
    this.currentFileIndex++;
    this.setState({
      message: `Sending file: ${name}...`,
      progressBarValue: this.currentFileIndex / this.maxFiles
    });
  }

  onError(arg: any) {
    console.log('Error', arg);
  }

}

export default withRouter<AddFilesProps>(AddFilesModal);