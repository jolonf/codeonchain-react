import './Home.css';
import './Node.css';

import { IonContent, IonRow, IonCol, IonGrid, IonButton, IonIcon } from '@ionic/react';
import React, { useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { document, folder } from 'ionicons/icons';

import showdown from 'showdown';
import MoneyButton from '@moneybutton/react-money-button';

import { Metanet } from '../metanet/metanet';
import { MetanetNode } from '../metanet/metanet_node';
import { BProtocol } from '../protocols/b.protocol';
import { BcatProtocol } from '../protocols/bcat.protocol';
import { Repo } from '../metanet/repo';
import Banner from '../components/Banner';
import AddFilesModal from '../components/AddFilesModal';
import NewFolderModal from '../components/NewFolderModal';
import { FileTree } from '../metanet/FileTree';

interface MatchParams {
  txId: string;
}
class NodePage extends React.Component< RouteComponentProps<MatchParams> > {

  state = {
    metanetNode: new MetanetNode(),
    children: [] as MetanetNode[],
    readme: '',
    fileData: null as (string | null),
    repo: null as (Repo | null),
    newFolderModalOpen: false,
    addFilesModalOpen: false,
    fileTrees: [] as FileTree[]
  };

  render() {
    const metanetNode = this.state.metanetNode;

    return (
      <>
        <IonContent >
          <Banner />
          <div id='metanet-node'>
            <NodeBanner metanetNode={metanetNode} repo={this.state.repo} />
            <Clone metanetNode={metanetNode} />
            {this.state.children.length > 0 &&
            <Children children={this.state.children} onFilesDropped={(items: any) => this.onFilesDropped(items)}/>}
            {this.state.metanetNode.isDirectory() &&
            <DirectoryButtons onNewFolderButton={() => this.onNewFolderButton()} onAddFilesButton={() => this.onAddFilesButton()}/>}
            <Readme text={this.state.readme} />
            <FileData metanetNode={metanetNode} data={this.state.fileData} />
            <AddFilesModal isOpen={this.state.addFilesModalOpen} onClose={() => {this.addFilesModalClosed()}} parent={metanetNode} fileTrees={this.state.fileTrees} />
            <NewFolderModal isOpen={this.state.newFolderModalOpen} onClose={() => {this.newFolderModalClosed()}} parent={metanetNode} />
          </div>
        </IonContent>
      </>
    );
  }

  async componentDidMount() {
    const txId = this.props.match.params.txId;
    const metanetNode = await Metanet.getMetanetNode(txId);
    if (!metanetNode || !metanetNode.nodeAddress) {
      throw new Error('Not a metanet transaction');
    }

    console.log(`Metanet Node public key: ${metanetNode.nodeAddress}`);
    console.log(`Metanet Node parent txid: ${metanetNode.parentTxId}`);

    this.setState({metanetNode: metanetNode});

    const files = await Metanet.getChildFiles(txId);
    const folders = await Metanet.getChildDirectories(txId);

    const children = files.concat(folders); //await Metanet.getChildNodes(txId);
    metanetNode.children = children;

    this.setState({children: children});

    if (children.length > 0) {
      const readmeNode = children.find(c => c.name.toLowerCase() === 'readme.md')
      if (readmeNode) {
        this.loadReadme(readmeNode);
      }
      const bsvpushData = children.find(c => c.name.toLowerCase() === 'bsvpush.json')
      if (bsvpushData) {
        this.loadBsvpushData(metanetNode, bsvpushData);
      }
    }
    this.loadFile(metanetNode);
  }

  async loadReadme(readmeNode: MetanetNode) {
    const md = (await Metanet.getMetanetNode(readmeNode.nodeTxId)).dataString;

    showdown.setFlavor('github');
    const converter = new showdown.Converter();
    const readme = converter.makeHtml(md);
    this.setState({readme: readme});
  }

  async loadBsvpushData(metanetNode: MetanetNode, bsvpushNode: MetanetNode) {
    const data = (await Metanet.getMetanetNode(bsvpushNode.nodeTxId)).dataString;
    const json = JSON.parse(data);

    const repo = new Repo(metanetNode.nodeAddress, metanetNode.nodeTxId, json);

    this.setState({repo: repo});
  }

  async loadFile(metanetNode: MetanetNode) {
    console.log(`mime type = ${metanetNode.mimeType}`);
    if (metanetNode.protocol === BProtocol.address || metanetNode.protocol === BcatProtocol.address) {
      if (metanetNode.mimeType === 'image/svg+xml') {
        console.log('svg data');
        this.setState({fileData: metanetNode.dataString});
      } else if (metanetNode.mimeType.startsWith('image/')) {
        console.log('img data');
        // Image
        const blob = new Blob([Buffer.from(metanetNode.dataHex, 'hex').buffer]);
        const url = URL.createObjectURL(blob);
        this.setState({fileData: url});
      } else {
        console.log('text data');
        console.log(`encoding: ${metanetNode.encoding}`);
        // Text
        this.setState({fileData: metanetNode.dataString});
      }
    }
  }

  onNewFolderButton() {
    this.setState({newFolderModalOpen: true});
  }

  onAddFilesButton() {
    this.setState({addFilesModalOpen: true});
  }

  newFolderModalClosed() {
    this.setState({newFolderModalOpen: false});
  }

  addFilesModalClosed() {
    this.setState({addFilesModalOpen: false});
  }

  async onFilesDropped(items: any) {
    const fileTrees = await AddFilesModal.itemListToFileTrees(items);
    this.setState({
      fileTrees: fileTrees,
      addFilesModalOpen: true
    });
  }
}

interface NodeBannerProps extends RouteComponentProps {
  metanetNode: MetanetNode;
  repo: Repo | null;
}
const NodeBanner = withRouter<NodeBannerProps>(({metanetNode, repo}) => {

  let backButton = null;
  if (metanetNode.parentTxId && metanetNode.parentTxId !== 'NULL') {
    backButton = <a href={'/tx/' + metanetNode.parentTxId} id='parent-back'>&lt;</a>;
  }

  let version = null;
  let sponsor = null;
  if (repo) {
    version = <span id='node-version'>{repo.version}</span>;
    if (repo.sponsor && repo.sponsor.to) {
      sponsor = <MoneyButton {...repo.sponsor} editable={true} />;
    }
  }

  return (
    <div id='node-banner'>
      <div id='node-banner-display'>
        <div id='node-title'>
          <div id='node-name'>{backButton} <span id='node-name'>{metanetNode.name}</span> {version}</div>
          <div id='node-txid'>
              <span id='node-publickey'>{metanetNode.nodeAddress}</span><br />
              <span id='node-txid'>{metanetNode.nodeTxId}</span>
          </div>
        </div>
        <div id='money-button-container'>
          {sponsor}
        </div>
      </div>
    </div>
  );
});

interface ChildrenProps extends RouteComponentProps {
  children: MetanetNode[];
  onFilesDropped: Function;
}
const Children = withRouter<ChildrenProps>(({children, onFilesDropped}) => {

  const [highlight, setHighlight] = useState(false);

  function onDragEnter(e: React.DragEvent<HTMLDivElement>) {
    e.stopPropagation();
    e.preventDefault();
    setHighlight(true);
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.stopPropagation();
    e.preventDefault();
    setHighlight(true);
  }

  function onDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.stopPropagation();
    e.preventDefault();
    setHighlight(false);
  }

  async function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.stopPropagation();
    e.preventDefault();
    setHighlight(false);
    if (e.dataTransfer.items) {
      onFilesDropped(e.dataTransfer.items);
    }
  }

  const rows = children.map((child, index) => {
    const icon = child.isDirectory() ? folder : document;
    return (
      <IonRow key={index}>
        <IonCol size='2'><IonIcon icon={icon}/> <a href={'/tx/' + child.nodeTxId}>{child.name}</a></IonCol>
        <IonCol size='10'>{child.nodeTxId}</IonCol>
      </IonRow>
    );
  });

  return (
    <div id='children-container' className={highlight ? 'children-drag-highlight' : ''} onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}>
      <IonGrid fixed>
        {rows}
      </IonGrid>
    </div>
  );
});

interface DirectoryButtonsProps extends RouteComponentProps {
  onNewFolderButton: Function;
  onAddFilesButton: Function;
}
const DirectoryButtons = withRouter<DirectoryButtonsProps>(({onAddFilesButton, onNewFolderButton}) => {
  return (
    <div id='directory-buttons-container'>
      <IonButton onClick={() => onAddFilesButton()} fill='outline' color='medium'><IonIcon slot='start' icon={document} /> + Files</IonButton>
      <IonButton onClick={() => onNewFolderButton()} fill='outline' color='medium'><IonIcon slot='start' icon={folder} /> + Folder</IonButton>
    </div>
  );
});

interface CloneProps extends RouteComponentProps {
  metanetNode: MetanetNode;
}
const Clone = withRouter<CloneProps>(({metanetNode}) => {
  return (
    <div id='clone-container'>
      <div id='clone'>
        Clone using <a href="https://github.com/jolonf/bsvpush">bsvpush</a>: <input type='text' readOnly value={'bsvpush clone ' + metanetNode.nodeTxId} />
      </div>
    </div>
  );
});

interface ReadmeProps extends RouteComponentProps {
  text: string | null;
}
const Readme = withRouter<ReadmeProps>(({text}) => {
  if (!text) {
    return null;
  }

  return <div id="readme" dangerouslySetInnerHTML={{__html: text}}></div>;
});

interface FileDataProps extends RouteComponentProps {
  metanetNode: MetanetNode;
  data: string | null;
}
const FileData = withRouter<FileDataProps>(({metanetNode, data}) => {
  if (!data) {
    return null;
  }

  let fileText = null;
  let img = null;
  let svg = null;

  if (data) {
    if (metanetNode.mimeType === 'image/svg+xml') {
      svg = (
        <div id='svg-data' dangerouslySetInnerHTML={{__html: data}}>
        </div>
      );
    } else if (metanetNode.mimeType.startsWith('image/')) {
      img = (
        <div id='img-data-container'>
            <img id="img-data" src={data} alt={metanetNode.name} />
        </div>
      );
    } else {
      fileText = (
        <pre id='text'>{data}</pre>
      );
    }
  }

  return (
    <div id='file-data'>
      {fileText}
      {img}
      {svg}
    </div>
  );
});


export default NodePage;