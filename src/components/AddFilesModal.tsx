

import React from "react";

import bsv from 'bsv';
import MoneyButton from '@moneybutton/react-money-button';
import { readAsText } from 'promise-file-reader';

import './Modal.css';
import './AddFilesModal.css';
import '../theme/variables.scss';
import { Metanet } from "../metanet/metanet";
import { FileTree } from "../metanet/file-tree"; 
import { FileTreeViewer } from './FileTreeViewer';
import { IonButton, IonIcon, IonProgressBar } from "@ionic/react";
import { MetanetNode } from "../metanet/metanet-node";
import { cloudUpload } from "ionicons/icons";
import { MasterKeyStorage } from "../storage/master-key-storage";
import { RouteComponentProps, withRouter, Switch, Route } from "react-router";
import { TransitionGroup, CSSTransition } from "react-transition-group";

import EditAttribution from "./EditAttribution";
import Modal from "./Modal";
import { Attribution } from "../storage/attribution";
import { AddFilesModalContext, AttributionsContext } from "../App";

interface AddFilesProps extends RouteComponentProps {
  onClose: Function;
  onFilesAdded: Function;
  parent: MetanetNode;
  context: AddFilesModalContext;
  attributions: AttributionsContext;
}

class AddFilesModal extends React.Component<AddFilesProps> {

  state = {
    xprivkey: '',
    moneyButtonProps: {} as any,
    message: '',
    dragHighlight: false,
    progressBarValue: 0,
    progressBarIndeterminate: false
  }

  fileInput: HTMLInputElement | null = null;
  folderInput: HTMLInputElement | null = null;

  currentFileIndex = 0;
  maxFiles = 0;

  render() {

    const fileTrees = this.props.context.fileTrees;
    const fileCount = this.countFiles(fileTrees);

    const xprv = this.state.xprivkey;
    const addFilesButtonDisabled = !(!this.state.moneyButtonProps.outputs && xprv && xprv.startsWith('xprv') && this.props.context.fileTrees.length > 0);
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
                {fileTrees.length > 0 &&
                <p id='file-count'>
                  {`${fileCount} file${fileCount > 1 ? 's' : ''}`} selected
                </p>}
              </div>
            </div>
            {fileTrees.length > 0 &&
            <div className='file-trees-container'>
              <FileTreeViewer fileTrees={fileTrees} />
            </div>}
            <div className='upload-buttons'>
              <div className='attribution-container'>
                <IonButton href={`${this.props.match.url}/attribution`} className='attribution-button' disabled={this.state.moneyButtonProps.outputs} color='dark' fill='outline'>Attribution...</IonButton>
              </div>
              <div>
                <IonButton onClick={() => this.onClose()} >Close</IonButton>
                <IonButton onClick={() => this.onAddFilesButton()} disabled={addFilesButtonDisabled} color='success' >Add Files</IonButton>
              </div>
              <div className='empty-space' />
            </div>
            {(this.state.moneyButtonProps.outputs || this.state.message || this.state.progressBarValue > 0 || this.state.progressBarIndeterminate) &&
            <div id='buttons'>
              {this.state.moneyButtonProps.outputs && 
                (
                  <div id='dialog-money-button-container'>
                    <p>
                      Swipe Money Button to upload files:
                    </p>
                    <div id='money-button-encapsulator'>
                      <MoneyButton 
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
    this.loadMasterKey();

    if (this.props.location.state && this.props.location.state.fileTrees) {
      const fileTrees = await this.filterFiles(this.props.location.state.fileTrees);
      this.props.context.setFileTrees(fileTrees);
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
      let fileTrees = await FileTree.itemListToFileTrees(e.dataTransfer.items);
      fileTrees = await this.filterFiles(fileTrees);
      this.props.context.setFileTrees(fileTrees);
      this.setState({moneyButtonProps: {}});
    }
  }

  async onFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    if (this.fileInput && this.fileInput.files) {
      let fileTrees = [] as FileTree[];
      for (let i = 0; i < this.fileInput.files.length; i++) {
        const file = this.fileInput.files[i];
        fileTrees.push(new FileTree(file.name, file));
      }
      fileTrees = await this.filterFiles(fileTrees);
      this.props.context.setFileTrees(fileTrees);
      this.setState({moneyButtonProps: {}});
    }
  }

  async onFolderSelected(e: React.ChangeEvent<HTMLInputElement>) {
    if (this.folderInput && this.folderInput.files) {
      let fileTrees = FileTree.fileListToFileTrees(this.folderInput.files);
      fileTrees = await this.filterFiles(fileTrees);
      this.props.context.setFileTrees(fileTrees);
      this.setState({moneyButtonProps: {}});
    }
  }

  onClose() {
    // Clear the fileTrees for next time
    this.props.context.setFileTrees([]);
    this.props.onClose();
  }

  onAddFilesButton() {
    if (this.fileInput && this.fileInput.files) {
      this.generateOutputs(this.props.context.fileTrees);
    }
  }

  onAttributions(a: Attribution[]) {
    this.props.attributions.setAttributions(a);
    this.props.history.push(this.props.match.url);
  }

  async filterFiles(fileTrees: FileTree[], ignoreList = [] as string[]): Promise<FileTree[]> {
    // If there is a .bsvignore file, read it in and append to the ignore list
    const bsvignoreFile = fileTrees.find(fileTree => fileTree.name === '.bsvignore');
    if (bsvignoreFile) {
      const text = await readAsText(bsvignoreFile.file!) as string;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      ignoreList = [...ignoreList, ...lines];
    }
    fileTrees = fileTrees.filter(fileTree => !ignoreList.includes(fileTree.name));

    for (const fileTree of fileTrees) {
      fileTree.children = await this.filterFiles(fileTree.children, ignoreList);
    }
    return fileTrees;
  }

  countFiles(fileTrees: FileTree[]) {
    return fileTrees.length === 0 ? 0 : fileTrees.map(fileTree => fileTree.fileCount()).reduce((sum, count) => sum + count);
  }

  countTxs(fileTrees: FileTree[]) {
    return fileTrees.length === 0 ? 0 : fileTrees.map(fileTree => fileTree.txCount()).reduce((sum, count) => sum + count);
  }

  async generateOutputs(fileTrees: FileTree[]) {
    const moneyButtonProps = this.state.moneyButtonProps;

    if (this.state.xprivkey) {
      // Transaction will create the root node as well as fund the root
      // so that the .bsvignore and bsvpush.json files can be created
      const masterKey = bsv.HDPrivateKey(this.state.xprivkey);

      this.setState({message: 'Estimating fees...'});
      this.currentFileIndex = 0;
      this.maxFiles = this.countTxs(fileTrees);
      await Metanet.estimateFileTreesFee(masterKey, this.props.parent, fileTrees, this.props.attributions.attributions, (name: string) => this.onEstimateFeeStatus(name));

      const outputs = [] as any[];
      this.generateFundingOutputs(outputs, masterKey, this.props.parent, fileTrees);
      console.log('Money Button outputs', outputs);
      moneyButtonProps.outputs = outputs;
    } else {
      this.setState({message: 'No master key!'});
    }
    this.setState({moneyButtonProps, message: '', progressBarValue: 0});
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
    this.setState({moneyButtonProps: {}});

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
    this.maxFiles = this.countTxs(this.props.context.fileTrees);

    try {
      this.setState({progressBarIndeterminate: true});
      await Metanet.waitForUnconfirmedParents(fundingTxId, (message: string) => this.onWaitForUnconfirmedParentsCallback(message));
      this.setState({progressBarIndeterminate: false});
      const txIds = await Metanet.sendFileTrees(masterKey, fundingTxId, this.props.parent, this.props.context.fileTrees, (name: string) => this.onSendFilesCallback(name));
      console.log('Files added, txIds: ', txIds); 
      this.setState({message: `Waiting for transaction to appear...`});
      this.setState({progressBarIndeterminate: true});
      await Metanet.waitForTransactionToAppearOnPlanaria(txIds[0]);
      this.setState({progressBarIndeterminate: false});
      this.setState({message: `Files Added`});
      // Clear file trees for next time
      this.props.context.setFileTrees([]);
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