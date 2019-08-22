import './Home.css';
import './Node.css';

import { IonContent, IonRow, IonCol, IonGrid, IonButton, IonIcon } from '@ionic/react';
import React, { useState } from 'react';
import { RouteComponentProps, withRouter, Route, Link, Switch } from 'react-router-dom';
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
import Modal from '../components/Modal';
import NodeAddressDetails from '../components/NodeAddressDetails';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

interface MatchParams {
  txId: string;
}
class NodePage extends React.Component< RouteComponentProps<MatchParams> > {

  initialState = {
    metanetNode: new MetanetNode(),
    children: [] as MetanetNode[],
    readme: '',
    fileData: null as (string | null),
    repo: null as (Repo | null),
    newFolderModalOpen: false,
    fileTrees: [] as FileTree[]
  };

  state = this.initialState;

  render() {
    const metanetNode = this.state.metanetNode;

    return (
      <>
        <IonContent >
          <Banner />
          <div id='metanet-node'>
            <NodeBanner metanetNode={metanetNode} repo={this.state.repo} />
            {metanetNode &&
            <>
              {this.state.metanetNode.nodeTxId &&
              <Clone metanetNode={metanetNode} />}
              {this.state.children.length > 0 &&
              <Children metanetNode={this.state.metanetNode} children={this.state.children} onFilesDropped={(items: any) => this.onFilesDropped(items)}/>}
              {metanetNode.isDirectory && metanetNode.isDirectory() &&
              <DirectoryButtons />}
              <Readme text={this.state.readme} />
              <FileData metanetNode={metanetNode} data={this.state.fileData} />

              <TransitionGroup>
                <CSSTransition key={this.props.location.key} classNames='fade' timeout={300}>
                  <Switch location={this.props.location}>

                      <Route path={`${this.props.match.path}/add-files`} render={() => (
                        <AddFilesModal onClose={() => this.props.history.push(this.props.match.url)} parent={metanetNode} fileTrees={this.state.fileTrees} />
                      )}/>
                      <Route path={`${this.props.match.path}/new-folder`} render={() => (
                        <NewFolderModal onClose={() => this.props.history.push(this.props.match.url)} parent={metanetNode} />
                      )}/>
                      <Route path={`${this.props.match.path}/details`} render={() => (
                        <Modal title='Node Details' onClose={() => {this.onCloseNodeAddressDetailsModal()}}>
                          <NodeAddressDetails node={this.state.metanetNode} onClose={() => {this.onCloseNodeAddressDetailsModal()}}/>
                        </Modal>
                      )} />

                  </Switch>
                </CSSTransition>
              </TransitionGroup>

            </>
            }
            
          </div>
        </IonContent>
      </>
    );
  }

  async componentDidMount() {
    this.loadNode(this.props.match.params.txId);
  }

  async componentDidUpdate(prevProps: RouteComponentProps<MatchParams>) {
    if (this.props.match.params.txId !== prevProps.match.params.txId) {
      this.loadNode(this.props.match.params.txId);
    }
  }

  async loadNode(txId: string) {
    // Clear existing state while the new state is loading
    this.setState(this.initialState);

    let parent = null;

    // We can be passed a MetanetNode to speed up loading
    if (this.props.location.state && this.props.location.state.node) {
      parent = this.props.location.state.node.parent;
      this.setState({metanetNode: this.props.location.state.node});
    } else {
      this.setState({metanetNode: new MetanetNode()});
    }

    const metanetNode = await Metanet.getMetanetNode(txId);
    if (!metanetNode || !metanetNode.nodeAddress) {
      throw new Error('Not a metanet transaction');
    }

    metanetNode.parent = parent;

    //console.log(`Metanet Node public key: ${metanetNode.nodeAddress}`);
    //console.log(`Metanet Node parent txid: ${metanetNode.parentTxId}`);

    this.setState({metanetNode: metanetNode});

    this.loadChildren(metanetNode);

    this.loadFile(metanetNode);
  }

  async loadChildren(metanetNode: MetanetNode) {
    metanetNode.children = await Metanet.getChildren(metanetNode.nodeAddress, metanetNode.nodeTxId);

    this.setState({children: metanetNode.children});

    if (metanetNode.children.length > 0) {
      const readmeNode = metanetNode.children.find(c => c.name.toLowerCase() === 'readme.md')
      if (readmeNode) {
        this.loadReadme(readmeNode);
      }
      const bsvpushData = metanetNode.children.find(c => c.name.toLowerCase() === 'bsvpush.json')
      if (bsvpushData) {
        this.loadBsvpushData(metanetNode, bsvpushData);
      }
    }
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
    //console.log(`mime type = ${metanetNode.mimeType}`);
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

  onCloseNodeAddressDetailsModal() {
    // The match URL doesn't contain any child routes so to go to the parent
    // which is this object we just go to the match URL
    this.props.history.push(this.props.match.url);
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
const NodeBanner = withRouter<NodeBannerProps>(({metanetNode, repo, match}) => {

  let backButton = null;
  if (metanetNode.parentTxId && metanetNode.parentTxId !== 'NULL') {
    backButton = (
    <>
      <Link to={{pathname: '/tx/' + metanetNode.parentTxId, state: {node: metanetNode.parent}}} id='parent-back'>{metanetNode.parent ? `${metanetNode.parent.name}` :'<'}</Link> {metanetNode.parent && ' /'}
    </>);
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
          <div id='node-name'>{backButton} <span id='node-name'>{metanetNode.name} {metanetNode.isDirectory && metanetNode.isDirectory() && (metanetNode.parentTxId !== 'NULL') && ' /'}</span> {version}</div>
          <div id='node-txid'>
              <Link id='node-publickey' to={`${match.url}/details`}>{metanetNode.nodeAddress}</Link><br />
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
  metanetNode: MetanetNode;
  children: MetanetNode[];
  onFilesDropped: Function;
}
const Children = withRouter<ChildrenProps>(({metanetNode, children, onFilesDropped}) => {

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
    child.parent = metanetNode;
    return (
      <IonRow key={index}>
        <IonCol size='4'><IonIcon icon={icon}/> <Link to={{pathname: '/tx/' + child.nodeTxId, state: {node: child}}}>{child.name}</Link></IonCol>
        <IonCol class='monospace' size='8'>{child.nodeTxId}</IonCol>
      </IonRow>
    );
  });

  return (
    <div id='children-container' className={highlight ? 'children-drag-highlight' : ''} onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}>
      <IonGrid>
        {rows}
      </IonGrid>
    </div>
  );
});


const DirectoryButtons = withRouter(({match}) => {
  return (
    <div id='directory-buttons-container'>
      <IonButton href={`${match.url}/add-files`} fill='outline' color='medium'><IonIcon slot='start' icon={document} /> + Files</IonButton>
      <IonButton href={`${match.url}/new-folder`} fill='outline' color='medium'><IonIcon slot='start' icon={folder} /> + Folder</IonButton>
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