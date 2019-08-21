import './Home.css';

import React, { useEffect, useState } from 'react';
import { IonContent, IonGrid, IonRow, IonCol, IonButton, IonTextarea } from '@ionic/react';
import { RoutedTabs, NavTab } from 'react-router-tabs';


import MoneyButton from '@moneybutton/react-money-button';

import { Repos } from '../metanet/repos';
import { Repo } from '../metanet/repo';
import Banner from '../components/Banner';
import { Switch, Route, RouteComponentProps, withRouter } from 'react-router';
import { MasterKeyStorage, MasterKeyEntry } from '../storage/MasterKeyStorage';
import { Link } from 'react-router-dom';
import Modal from '../components/Modal';

class Home extends React.Component<RouteComponentProps> {
  featuredTransactions = [
    '4bec3dc8e12fce17315084e01affd0b607fa11a857ecf7eed09caee06d74481d', // bitcoin-sv
    '21a58fae8d01df0b33f34e82e1ef30e49ad474e91890e027e926f88af15b9939', // bsvpush
    'a3663b6d8ef3d9b49e29152b60c5cadd9e2e673d90c12e029918028582fa3a17', // connect4
    'a508bb614add6a66ba14b05794c9ae98afb34675a26d591dced88221c5ca4d03'  // bcat-client-stream
  ];

  state = {
    tab: 'featured',
    repos: [] as Repo[]
  };

  render() {

    const rows = this.state.repos.map((repo, index) => {
      let sponsor = null;
      if (repo.sponsor && repo.sponsor.to) {
        sponsor = <MoneyButton {...repo.sponsor} />;
      }
  
      return (
        <IonRow key={index} className="ion-align-items-center">
          <IonCol size='2'><a href={'/tx/' + repo.nodeTxId}>{repo.name}</a></IonCol>
          <IonCol size='6'>{repo.description}</IonCol>
          <IonCol size-sm='1' size-xs="0">{repo.version}</IonCol>
          <IonCol size='2'>{sponsor}</IonCol>
        </IonRow>
      );
    });

    return (
      <>
        <IonContent className="ion-padding">
          <Banner />
          <ReposTabs />
          <Switch>

            <Route path='/featured-repos' component={FeaturedRepos}/>
            <Route path='/recent-repos' component={RecentRepos}/>
            <Route path='/' component={MyRepos}/>
          </Switch>
          <IonGrid fixed>
            {rows}
          </IonGrid>
          <p id='footer-message'>
            Metanet
          </p>
        </IonContent>
      </>
    );
  }

  async componentDidMount() {
    const txs = this.state.tab === 'featured' ? this.featuredTransactions : null;
    const repos = await Repos.getRepos(txs);
    this.setState({repos: repos});
  }
};

const ReposTabs = () => {
  return (
    <>
      <div id="repos-tabs">
        <RoutedTabs 
            tabClassName='tab'
            activeTabClassName='tab-selected'>
          <NavTab to='/' exact>My Repos</NavTab>
          <NavTab to='/featured-repos'>Featured</NavTab>
          <NavTab to='/recent-repos'>Recent</NavTab>
        </RoutedTabs>
      </div>
    </>
  );
};

const MyRepos = withRouter(({match, history}) => {

  const [masterKeys, setMasterKeys] = useState();
  const [loaded, setLoaded] = useState(false);
  const [importText, setImportText] = useState();
  const [errorMessage, setErrorMessage] = useState();

  useEffect(() => {
    setMasterKeys(MasterKeyStorage.getMasterKeys());
    setLoaded(true);
  }, []);

  const importMasterKeys = () => {
    try {
      setMasterKeys(MasterKeyStorage.importFromJSON(importText));
      history.push(match.url);
    } catch (e) {
      setErrorMessage(e.toString());
    }
  };

  return (
    <>
      <div>My Repos!</div>
      {masterKeys &&
        <>
          <IonGrid fixed>
            {masterKeys.map((entry: MasterKeyEntry, index: number) => (
              <IonRow key={index} className="ion-align-items-center">
                <IonCol size='2'><Link to={'/tx/' + entry.txId}>{entry.repoName}</Link></IonCol>
                <IonCol size='7'>{entry.txId}</IonCol>
              </IonRow>
            ))}
          </IonGrid>
          <IonButton onClick={() => history.push('/import')}>Import...</IonButton>
          <IonButton onClick={() => history.push('/export')}>Export...</IonButton>
          <Route path={'/export'} render={() => (
              <Modal title='Export Master Keys' onClose={() => history.push(match.url)}>
                <div>
                  <p>Copy the text and store in a text file.</p>
                  <pre>{JSON.stringify(masterKeys, null, 2)}</pre>
                  <IonButton onClick={() => history.push(match.url)}>Close</IonButton>
                </div>
              </Modal>
            )} />
          <Route path={'/import'} render={() => (
              <Modal title='Import Master Keys' onClose={() => history.push(match.url)}>
                <div>
                  <p>Paste Master Keys JSON.</p>
                  <IonTextarea rows={8} onInput={(e) => {setImportText((e.target! as HTMLInputElement).value)}} placeholder='Paste text here'/>
                  <IonButton onClick={() => history.push(match.url)}>Close</IonButton>
                  <IonButton onClick={importMasterKeys} disabled={!importText} color='success'>Import</IonButton>
                  {errorMessage &&
                  <p>{errorMessage}</p>}
                </div>
              </Modal>
            )} />
        </>
      }
      {!masterKeys && loaded &&
        <div>
          <p>You have no repos stored in this browser.</p>
          <p>Create a new repo to get started or view one of the featured or recent.</p>
          <p>Import master keys.</p>
        </div>
      }

    </>
  );
});

const FeaturedRepos = () => {
  return (
    <div>Featured Repos</div>
  );
};

const RecentRepos = () => {
  return (
    <div>Recent Repos</div>
  );
};

export default Home;