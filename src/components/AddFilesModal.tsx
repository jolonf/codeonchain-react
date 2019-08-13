

import React from "react";

import bsv from 'bsv';
import MoneyButton from '@moneybutton/react-money-button';

import './NewRepoModal.css';
import '../theme/variables.scss';
import { Metanet } from "../metanet/metanet";
import { FileTree } from "../metanet/FileTree"; 
import { IonButton, IonIcon } from "@ionic/react";
import { MetanetNode } from "../metanet/metanet_node";
import { cloud } from "ionicons/icons";

interface AddFilesProps {
  isOpen: boolean;
  onClose: Function;
  parent: MetanetNode;
}

class AddFilesModal extends React.Component<AddFilesProps> {

  state = {
    xprivkey: '',

    addFilesButtonDisabled: true,
    moneyButtonDisabled: true,
    moneyButtonProps: {} as any,

    message: ''
  }

  fileInput: HTMLInputElement | null = null;
  fileTrees: FileTree[] = [];

  render() {
    if (!this.props.isOpen) {
      return null;
    }

    return (
      <div id="new-repo-overlay" onClick={() => this.props.onClose()}>
        <div id="new-repo-dialog" onClick={(e) => {e.stopPropagation()}}>
          <h2>Add Files</h2>
          <hr />
          <table>
            <tbody>
              <tr>
                <td>Master key: </td>
                <td><input type='text' id='repo-master-key' onChange={(e) => this.onMasterKeyChanged(e)} size={64} placeholder='Enter the master key for this repository' /></td>
              </tr>    
            </tbody>
          </table>
          <div id='file-selection-container'>
            <div id='file-drop-area'>
              <IonIcon icon={cloud} size='large' />
              <p>Drop files here</p>
            </div>
            <div id='select-files-button-container'>
              <IonButton onClick={() => {this.onSelectFilesButton()}}>Select Files...</IonButton>
              <input ref={ref => this.setFileInputRef(ref)} onChange={(e) => this.onFilesSelected(e)} id='hidden-file-input' type='file' multiple />
            </div>
          </div>
          <div id='new-repo-money-button-container'>
            <div>
              <IonButton onClick={() => this.props.onClose()} >Close</IonButton>
              <IonButton onClick={() => this.onAddFilesButton()} disabled={this.state.addFilesButtonDisabled} color='success' >Add Files</IonButton>
            </div>

            {!this.state.moneyButtonDisabled && 
              (
                <div>
                  <p>
                    Swipe Money Button to upload files:
                  </p>
                  <div>
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
            <p>
              {this.state.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  componentDidMount() {
    this.setState({
      addFilesButtonDisabled: true,
      moneyButtonDisabled: true
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

    if (e.target.value && this.fileInput && this.fileInput.files) {
      this.setState({addFilesButtonDisabled: false});
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
      this.setState({addFilesButtonDisabled: false});
    }
  }

  onAddFilesButton() {
    if (this.fileInput && this.fileInput.files) {
      this.setState({addFilesButtonDisabled: true});
      this.fileTrees = this.fileListToFileTrees(this.fileInput.files);
      this.generateOutputs(this.fileTrees);
    }

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
        const path = file.webkitRelativePath as string;
        if (path) {
          const pathComponents = path.split('/');
          let children = fileTrees;
          pathComponents.forEach((pc, i) => {
            let f = children.find(c => c.name === pc);
            if (!f) {
              f = new FileTree(pc, i === pathComponents.length - 1 ? file : null);
              children.push(f);
            }
            children = f.children;
          });
        }
      });

      return fileTrees;
  }

  async generateOutputs(fileTrees: FileTree[]) {
    console.log('generate outputs');
    const moneyButtonProps = this.state.moneyButtonProps;
    let moneyButtonDisabled = true;

    if (this.state.xprivkey) {
      // Transaction will create the root node as well as fund the root
      // so that the .bsvignore and bsvpush.json files can be created
      const masterKey = bsv.HDPrivateKey(this.state.xprivkey);

      this.setState({message: 'Estimating fee...'});

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
    this.setState({moneyButtonDisabled, moneyButtonProps, message: ''});
  }

  onEstimateFeeStatus(name: string) {
    this.setState({message: `Estimating fee for file: ${name}...`});
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

  async onPayment(arg: any) {
    console.log('on payment');
    const fundingTxId = arg.txid;
    console.log('funding txid: ' + fundingTxId);
    const masterKey = bsv.HDPrivateKey(this.state.xprivkey);

    await Metanet.sendFileTrees(masterKey, fundingTxId, 0, this.props.parent, this.fileTrees, (name: string) => {this.onSendFilesCallback(name)});

    console.log(`Files added`); 
    this.setState({message: `Files added`});
  }

  onSendFilesCallback(name: string) {
    this.setState({message: `Sending file: ${name}...`});
  }

  onError(arg: any) {
    console.log('Error', arg);
  }


}

export default AddFilesModal;