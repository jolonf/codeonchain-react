import React from 'react';
import { Route } from 'react-router-dom';
import { IonApp, IonPage, IonRouterOutlet } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Home from './pages/Home';
import NodePage from './pages/Node';

/* Core CSS required for Ionic components to work properly */
import '@ionic/core/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/core/css/normalize.css';
import '@ionic/core/css/structure.css';
import '@ionic/core/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/core/css/padding.css';
import '@ionic/core/css/float-elements.css';
import '@ionic/core/css/text-alignment.css';
import '@ionic/core/css/text-transformation.css';
import '@ionic/core/css/flex-utils.css';
import '@ionic/core/css/display.css';
import { FileTree } from './metanet/file-tree';
import { Attribution } from './storage/attribution';

export interface NewRepoModalContext {
  storeMasterKey: boolean;
  setStoreMasterKey: (storeMasterKey: boolean) => void;
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;
  website: string;
  setWebsite: (website: string) => void;
  gitHub: string;
  setGitHub: (gitHub: string) => void;
  hidden: boolean;
  setHidden: (hidden: boolean) => void;
}

export interface AddFilesModalContext {
  fileTrees: FileTree[];
  setFileTrees: (fileTrees: FileTree[]) => void;
}

export interface NewFolderModalContext {
  name: string;
  setName: (name: string) => void;
}

export interface NewLinkModalContext {
  txId: string;
  setTxId: (txId: string) => void;
  name: string;
  setName: (name: string) => void;
}

export interface AttributionsContext {
  attributions: Attribution[];
  setAttributions: (attributions: Attribution[]) => void;
}

interface AppContextInterface {
  newRepoModal: NewRepoModalContext;
  addFilesModal: AddFilesModalContext;
  newFolderModal: NewFolderModalContext;
  newLinkModal: NewLinkModalContext;
  attributions: AttributionsContext;
};

export const AppContext = React.createContext<Partial<AppContextInterface>>({});

class App extends React.Component<any, AppContextInterface> { 

  readonly state: AppContextInterface = {
    newRepoModal: {
      storeMasterKey: true,
      setStoreMasterKey: (storeMasterKey: boolean) => this.setState(state => ({newRepoModal: {...state.newRepoModal, storeMasterKey}})),
      name: '',
      setName: (name: string) => this.setState(state => ({newRepoModal: {...state.newRepoModal, name: name}})),
      description: '',
      setDescription: (description: string) => this.setState(state => ({newRepoModal: {...state.newRepoModal, description}})),
      website: '',
      setWebsite: (website: string) => this.setState(state => ({newRepoModal: {...state.newRepoModal, website}})),
      gitHub: '',
      setGitHub: (gitHub: string) => this.setState(state => ({newRepoModal: {...state.newRepoModal, gitHub}})),
      hidden: false,
      setHidden: (hidden: boolean) => this.setState(state => ({newRepoModal: {...state.newRepoModal, hidden}}))
    },
    addFilesModal: {
      fileTrees: [],
      setFileTrees: (fileTrees: FileTree[]) => this.setState(state => ({addFilesModal: {...state.addFilesModal, fileTrees}}))
    },
    newFolderModal: {
      name: '',
      setName: (name: string) => this.setState(state => ({newFolderModal: {...state.newFolderModal, name}}))
    },
    newLinkModal: {
      txId: '',
      setTxId: (txId: string) => this.setState(state => ({newLinkModal: {...state.newLinkModal, txId}})),
      name: '',
      setName: (name: string) => this.setState(state => ({newLinkModal: {...state.newLinkModal, name}}))
    },
    attributions: {
      attributions: [],
      setAttributions: (attributions: Attribution[]) => this.setState(state => ({attributions: {...state.attributions, attributions}}))      
    }
  };

  render = () =>
    (
      <AppContext.Provider value={this.state}>
        <IonApp>
          <IonReactRouter>
            <IonPage>
              <IonRouterOutlet>
                <Route path="/tx/:txId" component={NodePage} />
                <Route path="/" component={Home} />
              </IonRouterOutlet>
            </IonPage>
          </IonReactRouter>
        </IonApp>
      </AppContext.Provider>
    );

};

export default App;
