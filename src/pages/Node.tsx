import './Node.css';

import { IonContent, IonButton, IonIcon } from '@ionic/react';
import React from 'react';
import { RouteComponentProps, withRouter, Route, Switch } from 'react-router-dom';
import { document, folder, link, cloudDownload } from 'ionicons/icons';

import showdown from 'showdown';

import { Metanet } from '../metanet/metanet';
import { MetanetNode } from '../metanet/metanet-node';
import { BProtocol } from '../protocols/b.protocol';
import { BcatProtocol } from '../protocols/bcat.protocol';
import { Repo } from '../metanet/repo';
import Banner from '../components/Banner';
import NodeBanner from '../components/NodeBanner';
import AddFilesModal from '../components/AddFilesModal';
import NewFolderModal from '../components/NewFolderModal';
import Modal from '../components/Modal';
import NodeAddressDetails from '../components/NodeAddressDetails';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import NodeChildren from '../components/NodeChildren';
import FileData from '../components/FileData';
import NewLinkModal from '../components/NewLinkModal';
import Download from '../components/Download';
import { DirectoryProtocol } from '../protocols/directory.protocol';

interface MatchParams {
  txId: string;
}
class NodePage extends React.Component< RouteComponentProps<MatchParams> > {

  initialState = {
    metanetNode: new MetanetNode(),
    children: [] as MetanetNode[],
    readme: '',
    fileData: null as (string | null), // File text or ObjectURL string
    repo: null as (Repo | null)
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
              {this.state.children.length > 0 &&
              <NodeChildren metanetNode={this.state.metanetNode} children={this.state.children} />}
              {metanetNode.isDirectory && metanetNode.isDirectory() &&
              <DirectoryButtons />}
              <Readme text={this.state.readme} />
              <FileData metanetNode={metanetNode} data={this.state.fileData} />

              <TransitionGroup>
                <CSSTransition key={this.props.location.key} classNames='fade' timeout={300}>
                  <Switch location={this.props.location}>

                      <Route path={`${this.props.match.path}/add-files`} render={() => (
                        <AddFilesModal onClose={() => this.props.history.push(this.props.match.url)} onFilesAdded={() => this.onFilesAdded()} parent={metanetNode} />
                      )}/>
                      <Route path={`${this.props.match.path}/new-folder`} render={() => (
                        <NewFolderModal onClose={() => this.props.history.push(this.props.match.url)} onFolderCreated={() => this.onFilesAdded()} parent={metanetNode} />
                      )}/>
                      <Route path={`${this.props.match.path}/new-link`} render={() => (
                        <NewLinkModal parent={this.state.metanetNode} onClose={() => this.props.history.push(this.props.match.url)} onFilesAdded={() => {this.onFilesAdded()}}/>
                      )} />
                      <Route path={`${this.props.match.path}/details`} render={() => (
                        <Modal title='Node Details' onClose={() => {this.onCloseNodeAddressDetailsModal()}}>
                          <NodeAddressDetails node={this.state.metanetNode} onClose={() => {this.onCloseNodeAddressDetailsModal()}}/>
                        </Modal>
                      )} />
                      <Route path={`${this.props.match.path}/download`} render={() => (
                        <Modal title='Download' onClose={() => this.props.history.push(this.props.match.url)}>
                          <Download node={this.state.metanetNode} onClose={() => this.props.history.push(this.props.match.url)}/>
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
      // If the node is a link to a directory then redirect to the link
      if (this.props.location.state.node.link
          && this.props.location.state.node.link.protocolHints.includes(DirectoryProtocol.address)) {
        this.props.history.replace(`/tx/${this.props.location.state.node.link.txId}`);
        return;
      }
    } else {
      this.setState({metanetNode: new MetanetNode()});
    }

    const metanetNode = await Metanet.getMetanetNode(txId);
    if (!metanetNode || !metanetNode.nodeAddress) {
      throw new Error('Not a metanet transaction');
    }

    metanetNode.parent = parent;
    this.setState({metanetNode: metanetNode});
    // If the node is a link to a directory then redirect to the link
    if (metanetNode.link
      && metanetNode.link.protocolHints.includes(DirectoryProtocol.address)) {
      this.props.history.replace(`/tx/${metanetNode.link.txId}`);
      return;
    }

    this.loadChildren(metanetNode);
    this.loadFile(metanetNode);
  }

  async loadChildren(metanetNode: MetanetNode) {
    this.setState({children: await metanetNode.loadChildren()});

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
    const protocols = (metanetNode.link && metanetNode.link.protocolHints) || [metanetNode.protocol];
    const txId = (metanetNode.link && metanetNode.link.txId) || metanetNode.nodeTxId;

    if (protocols.includes(BProtocol.address) || protocols.includes(BcatProtocol.address)) {
      if (metanetNode.mimeType.startsWith('video')) {
        this.setState({fileData: `https://bico.media/${txId}`});
      } else {
        let buffer;
        if (metanetNode.link) {
          const response = await fetch(`https://bico.media/${metanetNode.link.txId}`);
          buffer = Buffer.from(await response.arrayBuffer());
        } else if (metanetNode.protocol === BcatProtocol.address) {
          buffer = await Metanet.getBcatData(metanetNode.partTxIds);
        }

        if (metanetNode.mimeType === 'image/svg+xml') {
          // SVG
          this.setState({fileData: (buffer && buffer.toString()) || metanetNode.dataString});
        } else if (metanetNode.mimeType.startsWith('image/')) {
          // Image
          const blob = new Blob([buffer || Buffer.from(metanetNode.dataBase64, 'base64').buffer]);
          const url = URL.createObjectURL(blob);
          this.setState({fileData: url});
        } else {
          // Text
          this.setState({fileData: (buffer && buffer.toString()) || metanetNode.dataString});
        }
      }
    }
  }

  onCloseNodeAddressDetailsModal() {
    this.props.history.push(this.props.match.url);
  }

  async onFilesAdded() {
    // Reload children
    await this.loadChildren(this.state.metanetNode);
    // Close
    this.props.history.push(this.props.match.url);
  }
}

const DirectoryButtons = withRouter(({match}) => {
  return (
    <div id='directory-buttons-container'>
      <IonButton href={`${match.url}/add-files`} fill='outline' color='medium'><IonIcon slot='start' icon={document} /> + Files</IonButton>
      <IonButton href={`${match.url}/new-folder`} fill='outline' color='medium'><IonIcon slot='start' icon={folder} /> + Folder</IonButton>
      <IonButton href={`${match.url}/new-link`} fill='outline' color='medium'><IonIcon slot='start' icon={link.ios} /> + Link</IonButton>
      <IonButton href={`${match.url}/download`} id='download-button' fill='outline' color='medium'><IonIcon slot='start' icon={cloudDownload} /> Download</IonButton>
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

export default NodePage;