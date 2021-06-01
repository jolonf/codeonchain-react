import './Download.css';

import React from "react";
import JSZip  from 'jszip';
import FileSaver from 'file-saver';
import { MetanetNode } from "../metanet/metanet-node";
import { IonButton, IonIcon } from '@ionic/react';
import { Metanet } from '../metanet/metanet';
import { download } from 'ionicons/icons';

interface DownloadProps {
  node: MetanetNode;
  onClose: Function;
}

class Download extends React.Component<DownloadProps> {

  state = {
    message: '',
    loading: false,
    zipFile: null as Blob | null
  };

  render() {
    return (
      <>
        <p>{this.state.message}</p>

        <div className='center'>
          <IonButton onClick={() => {this.props.onClose()}}>Close</IonButton>
          <IonButton onClick={() => {this.onSave()}} disabled={!this.state.zipFile} color='success'><IonIcon icon={download} slot='start'/>Save Zip</IonButton>
        </div>
      </>
    );
  }

  async componentDidMount() {
    const zip = new JSZip();
    await this.download(zip, this.props.node);
    this.setState({message: 'Zipping...'});
    const zipFile = await zip.generateAsync({type: 'blob'});
    this.setState({zipFile: zipFile});
    this.setState({message: 'Complete'});
  }

  async download(zip: JSZip | null, node: MetanetNode, path = '') {
    this.setState({message: `Zipping: ${path}/${node.name}`});

    if (node.isDirectory()) {
      const folder = zip!.folder(node.name);
      const children = await Metanet.getChildren(node.nodeAddress, node.nodeTxId, true);
      for (const child of children) {
        await this.download(folder, child, path + '/' + node.name);
      }
    } else if (node.isLink()) {
      const json = {
        link: {
          txId: node.link!.txId
        }
      }
      zip!.file(node.name, JSON.stringify(json, null, 2));
    } else {
      zip!.file(node.name, node.dataBase64, {base64: true});
    }
  }

  onSave() {
    FileSaver.saveAs(this.state.zipFile!, `${this.props.node.name}.zip`);
  }
}

export default Download;