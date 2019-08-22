

import React from "react";

import bsv from 'bsv';
import MoneyButton from '@moneybutton/react-money-button';

import './Modal.css';
import './AddFilesModal.css';
import '../theme/variables.scss';
import { Metanet } from "../metanet/metanet";
import { FileTree } from "../metanet/FileTree"; 
import { FileTreeViewer } from './FileTreeViewer';
import { IonButton, IonIcon, IonProgressBar } from "@ionic/react";
import { MetanetNode } from "../metanet/metanet_node";
import { cloudUpload } from "ionicons/icons";
import { MasterKeyStorage } from "../storage/MasterKeyStorage";

interface AddFilesProps {
  onClose: Function;
  parent: MetanetNode;
  fileTrees: FileTree[];
}

class AddFilesModal extends React.Component<AddFilesProps> {

  state = {
    xprivkey: '',

    addFilesButtonDisabled: true,
    moneyButtonDisabled: true,
    moneyButtonProps: {} as any,

    message: '',

    dragHighlight: false,

    fileTrees: this.props.fileTrees,

    progressBarValue: 0,
    progressBarIndeterminate: false
  }

  fileInput: HTMLInputElement | null = null;

  currentFileIndex = 0;
  maxFiles = 0;

  render() {

    return (
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
                <IonButton onClick={() => {this.onSelectFilesButton()}}>Select Files...</IonButton>
                <input ref={ref => this.setFileInputRef(ref)} onChange={(e) => this.onFilesSelected(e)} id='hidden-file-input' type='file' multiple />
              </div>
              {this.state.fileTrees.length > 0 &&
              <p id='file-count'>
                {this.countFiles(this.state.fileTrees)} file(s) selected
              </p>}
            </div>
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
    );
  }

  componentDidMount() {
    const masterKeyEntry = MasterKeyStorage.getMasterKeyEntry(this.props.parent.nodeAddress);

    if (masterKeyEntry) {
      this.setState({xprivkey: masterKeyEntry.masterKey});
    } else {
      console.log('MasterKey entry not found in local storage');
    }

    this.setState({fileTrees: this.props.fileTrees});

    if (this.props.fileTrees.length > 0) {
      this.setState({addFilesButtonDisabled: false});
    }

    this.setState({
      moneyButtonDisabled: true,
      message: '',
      progressBarValue: 0,
      progressBarIndeterminate: false
    });
  }

  /**
   * Hack to get around TypeScript not supporting the webkitdirectory directly in JSX.
   * @param ref 
   */
  setFileInputRef(ref: HTMLInputElement | null) {
    if (ref) {
      this.fileInput = ref;
      this.fileInput.setAttribute('webkitdirectory', 'true');
    }
  }

  onMasterKeyChanged(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({xprivkey: e.target.value});
    this.setState({moneyButtonDisabled: true});

    if (e.target.value && this.state.fileTrees.length > 0) {
      this.setState({addFilesButtonDisabled: false});
    }
  }

  onDragEnter() {
    this.setState({dragHighlight: true});
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
      const fileTrees = await AddFilesModal.itemListToFileTrees(e.dataTransfer.items);
      this.setState({
        fileTrees: fileTrees,
        moneyButtonDisabled: true
      });
      if (this.state.xprivkey) {
        this.setState({addFilesButtonDisabled: false});
      }
    }
  }

  onSelectFilesButton() {
    const htmlElement = this.fileInput as HTMLElement;
    htmlElement.click();
  }

  async onFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    console.log('Files selected');
    console.log(e.target.files);

    if (this.state.xprivkey && this.fileInput && this.fileInput.files) {
      this.setState({
        fileTrees: this.fileListToFileTrees(this.fileInput.files),
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

  static async itemListToFileTrees(itemList: DataTransferItemList): Promise<FileTree[]> {
    // Convert to array
    const entries = [] as any[];
    const fileTrees = [] as FileTree[];

    for (let i = 0; i < itemList.length; i++) {
      entries.push(itemList[i].webkitGetAsEntry());
    }

    for (const entry of entries) {
      fileTrees.push(await this.entryToFileTree(entry));
    }

    return fileTrees;
  }

  static async entryToFileTree(entry: any): Promise<FileTree> {
    let file = null;
    if (entry.isFile) {
      file = await this.getEntryFile(entry);
    }

    const fileTree = new FileTree(entry.name, file);

    if (entry.isDirectory) {
      const directoryReader = entry.createReader();

      const entries = await this.readEntries(directoryReader);
      for (const childEntry of entries) {
          fileTree.children.push(await this.entryToFileTree(childEntry));
      }
    }

    return fileTree;
  }

  static async readEntries(directoryReader: any): Promise<any[]> {
    return new Promise<any[]>(resolve => {
      directoryReader.readEntries((entries: any[]) => resolve(entries));
    });
  }

  static async getEntryFile(entry: any): Promise<File> {
    return new Promise<File>(resolve => {
      entry.file((file: File) => resolve(file))
    });
  }

  /**
   * 
   * @param fileList
   * @returns array of FileTree objects
   */
  fileListToFileTrees(fileList: FileList): FileTree[] {
      // Convert to array
      const files = [];
      const fileTrees = [] as FileTree[];

      for (let i = 0; i < fileList.length; i++) {
        files.push(fileList[i]);
      }

      files.forEach((file: any) => {
        //console.log('File', file);
        const path = file.webkitRelativePath as string;
        if (path) {
          const pathComponents = path.split('/');
          let children = fileTrees;
          pathComponents.forEach((pc, i) => {
            //console.log(`pc: ${pc}`);
            let f = children.find(c => c.name === pc);
            if (!f) {
              //console.log(`Creating FileTree for ${pc}`);
              f = new FileTree(pc, i === pathComponents.length - 1 ? file : null);
              children.push(f);
            }
            children = f.children;
          });
        }
      });

      return fileTrees;
  }

  countFiles(fileTrees: FileTree[]) {
    return fileTrees.length === 0 ? 0 : fileTrees.map(fileTree => fileTree.fileCount()).reduce((sum, count) => sum + count);
  }

  async generateOutputs(fileTrees: FileTree[]) {
    console.log('generate outputs');
    const moneyButtonProps = this.state.moneyButtonProps;
    let moneyButtonDisabled = true;

    if (this.state.xprivkey) {
      // Transaction will create the root node as well as fund the root
      // so that the .bsvignore and bsvpush.json files can be created
      const masterKey = bsv.HDPrivateKey(this.state.xprivkey);

      this.setState({message: 'Estimating fees...'});
      this.currentFileIndex = 1;
      this.maxFiles = this.countFiles(fileTrees);

      const fee = await Metanet.estimateFileTreesFee(masterKey, this.props.parent, fileTrees, (name: string) => this.onEstimateFeeStatus(name));

      console.log(`Fee: ${fee}`);

      const outputs = [] as any[];

      this.generateFundingOutputs(outputs, masterKey, this.props.parent, fileTrees);

      console.log('Parent node: ', this.props.parent);
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
    this.setState({
      message: `Estimating fees: ${this.currentFileIndex} of ${this.maxFiles}`,
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
        outputs.push({
          to: parent.nodeAddress,
          amount: metanetNode.fee / 1e8,
          currency: 'BSV'
        });
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
    this.currentFileIndex = 1;
    this.maxFiles = this.countFiles(this.state.fileTrees);

    try {
      this.setState({progressBarIndeterminate: true});
      await Metanet.waitForUnconfirmedParents(fundingTxId, (message: string) => this.onWaitForUnconfirmedParentsCallback(message));
      this.setState({progressBarIndeterminate: false});
      await Metanet.sendFileTrees(masterKey, fundingTxId, 0, this.props.parent, this.state.fileTrees, (name: string) => this.onSendFilesCallback(name));
      console.log(`Files added`); 
      this.setState({message: `Files added, reloading page...`});
      window.location.reload(false);
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

export default AddFilesModal;