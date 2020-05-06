import './SearchResults.css';

import React from 'react';
import { IonContent, IonGrid, IonRow, IonCol } from '@ionic/react';
import { NavTab } from 'react-router-tabs';

import MoneyButton from '@moneybutton/react-money-button';

import MyRepos from '../components/MyRepos';
import Banner from '../components/Banner';
import { Switch, Route, RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import { Metanet } from '../metanet/metanet';
import { MetanetNode } from '../metanet/metanet-node';
import { AppContext } from '../App';

class SearchResults extends React.Component<RouteComponentProps> {

  render() {
    return (
      <>
        <IonContent>
          <Banner />
          <ReposTabs />
          <Switch>

            <Route path='/featured-repos' component={FeaturedRepos}/>
            <Route path='/recent-repos' component={RecentRepos}/>
            <Route path='/' render={() =>
              <AppContext.Consumer>
                {({ masterKeys }) =>
                  <MyRepos masterKeys= {masterKeys!} />
                }
              </AppContext.Consumer>
            }/>
          </Switch>
          <p id='footer-message'>
            <a href='https://medium.com/@jolon/codeonchain-v2-d8967aec20ac' target='_blank' rel="noopener noreferrer">Documentation</a>
          </p>
        </IonContent>
      </>
    );
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

class FeaturedRepos extends React.Component {
  readonly state = {
    repos: [] as MetanetNode[]
  };

  render () {
    return (
      <div className='repos'>
        <ReposView repos={this.state.repos}/>
      </div>
    );
  }

  async componentDidMount() {
    const response = await fetch('/featured-repos.json');
    const json = await response.json();
    const txIds = json.featuredRepos.map((r: any) => r.txId) as string[];
    const metanetNodes = await Metanet.getMetanetNodesByTxIds(txIds);
    // Preserve original order
    const repos = txIds.map(txId => metanetNodes.find(m => m.nodeTxId === txId));
    this.setState({repos: repos});
  }
}

class RecentRepos extends React.Component {
  readonly state = {
    repos: [] as MetanetNode[]
  };

  async componentDidMount() {
    const repos = await Metanet.getRecentRepos();
    //console.log('repos', repos);
    this.setState({repos: repos});
  }

  render () {
    return (
      <div className='repos'>
        <ReposView repos={this.state.repos}/>
      </div>
    )
  }
}

interface ReposViewProps {
  repos: MetanetNode[];
}
const ReposView: React.FunctionComponent<ReposViewProps> = ({repos}) => {
  return (
    <>
      <IonGrid>
        {repos.map((repo: MetanetNode, index: number) => {
          let sponsor = null;
          if (repo.attributions.length > 0) {
            const outputs = repo.attributions.map(attribution => { 
              const output = {
                amount: attribution.defaultAmount,
                currency: attribution.currency
              } as any;
        
              // Determine whether to use the address or paymail field
              if (attribution.sponsor.includes('@')) {
                output.paymail = attribution.sponsor;
              } else {
                output.address = attribution.sponsor;
              }
              return output;
            });
            sponsor = <MoneyButton outputs={outputs} editable={false} label='Tip' successMessage='Thanks!' />;
          }

          return (
              <IonRow key={index} className="ion-align-items-center">
                <IonCol sizeMd='3' sizeSm='4' sizeXs='5'><Link to={'/tx/' + repo.nodeTxId}>{repo.name}</Link></IonCol>
                <IonCol sizeMd='2' sizeSm='3' sizeXs='4' className='sponsor-col'>{sponsor}</IonCol>
                <IonCol sizeMd='7' sizeSm='5' sizeXs='3' className='grey'>{repo.repo!.description}</IonCol>
              </IonRow>
            )
          }
        )}
      </IonGrid>

    </>
  );
}

export default SearchResults;