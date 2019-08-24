import './Home.css';

import React, { useEffect, useState } from 'react';
import { IonContent, IonGrid, IonRow, IonCol, IonButton, IonToast } from '@ionic/react';
import { NavTab } from 'react-router-tabs';

import { readAsText } from 'promise-file-reader';

import MoneyButton from '@moneybutton/react-money-button';

import { Repos } from '../metanet/repos';
import { Repo } from '../metanet/repo';
import Banner from '../components/Banner';
import { Switch, Route, RouteComponentProps } from 'react-router';
import { MasterKeyStorage, MasterKeyEntry } from '../storage/MasterKeyStorage';
import { Link } from 'react-router-dom';

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
        <IonContent>
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
        <NavTab className='tab' activeClassName='tab-selected' to='/' exact>My Repos</NavTab>
        <NavTab className='tab' activeClassName='tab-selected' to='/featured-repos'>Featured</NavTab>
        <NavTab className='tab' activeClassName='tab-selected' to='/recent-repos'>Recent</NavTab>
      </div>
    </>
  );
};

const MyRepos = () => {

  const [masterKeys, setMasterKeys] = useState();
  const [loaded, setLoaded] = useState(false);
  const [exportObjectUrl, setExportObjectUrl] = useState();
  const [message, setMessage] = useState({message: '', color: 'dark', duration: 1000, showCloseButton: false});

  useEffect(() => {
    const masterKeys = MasterKeyStorage.getMasterKeys();
    setMasterKeys(masterKeys);
    const masterKeysJSON = JSON.stringify(masterKeys, null, 2);
    setExportObjectUrl(URL.createObjectURL(new File([masterKeysJSON], 'masterkeys.json', { type: 'application/json' })));
    setLoaded(true);
  }, []);

  const importMasterKeys = () => {
    const fileInput = document.getElementById('hidden-file-input');
    fileInput!.click();
  };

  const onFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const json = await readAsText(e.target!.files![0]);
      setMasterKeys(MasterKeyStorage.importFromJSON(json));
      setMessage({
        message: `Master keys imported`,
        color: 'dark',
        duration: 2000,
        showCloseButton: false
      });
    } catch (e) {
      setMessage({
        message: `Error reading file: ${e.toString()}`,
        color: 'danger',
        duration: 0,
        showCloseButton: true
      });
    }
  };

  const exportMasterKeys = () => {
    const a = document.getElementById('hidden-export-link');
    a!.click();
  };

  return (
    <>
      <div className='repos'>
        {masterKeys &&
          <>
            <IonGrid fixed>
              {masterKeys.map((entry: MasterKeyEntry, index: number) => (
                <IonRow key={index} className="ion-align-items-center">
                  <IonCol size='2'><Link to={'/tx/' + entry.txId}>{entry.repoName}</Link></IonCol>
                  <IonCol size='10' className='monospace grey'>{entry.txId}</IonCol>
                </IonRow>
              ))}
            </IonGrid>
          </>
        }
        {!masterKeys && loaded &&
          <div className='no-repos'>
            <p>Create a new repo to get started</p>
            <p><IonButton href='/new-repo' color='success'>+ New Repository</IonButton></p>
            <p>Or view one of the <Link to='/featured-repos'>featured</Link> or <Link to='/recent-repos'>recently</Link> added repos.</p>
          </div>
        }
      </div>
      <div className='flex-center'>
        <IonButton onClick={importMasterKeys} color='medium' size='small'>Import...</IonButton>
        <IonButton onClick={exportMasterKeys} color='medium' disabled={!masterKeys} size='small'>Export...</IonButton>
        <a id='hidden-export-link' href={exportObjectUrl} download='masterkeys.json'> </a>
        <input onChange={onFilesSelected} id='hidden-file-input' type='file' />
      </div>
      <IonToast isOpen={!!message.message} onDidDismiss={() => setMessage({message: '', color: 'dark', duration: 0, showCloseButton:false})} message={message.message} duration={message.duration} color={message.color} showCloseButton={message.showCloseButton} />
    </>
  );
};

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