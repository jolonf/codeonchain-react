import { IonButton, IonSearchbar } from '@ionic/react';
import React from 'react';
import NewRepoModal from './NewRepoModal';
import './Banner.css';
import '../theme/variables.scss';
import '../globals.scss';
import { Link, withRouter, Route, Switch } from 'react-router-dom';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import Modal from './Modal';
import { AppContext } from '../App';

const Banner = withRouter(({history, match, location}) => {

  function search(e: KeyboardEvent) {
    if (e.keyCode === 13) {
      e.preventDefault();
      const value = (e.target as HTMLInputElement).value;
      if (value.length === 64) {
        history.push(`/tx/${(e.target as HTMLInputElement).value}`);
      }
    }
  }

  const baseURL = match.url === '/' ? '' : match.url;
  const basePath = match.path === '/' ? '' : match.path;

  return (
    <>
      <div id='banner'>
        <div id='title-container'>
          <Logo />
          <span id='upload'>Upload repositories to metanet</span>
        </div>
        <div id='banner-right'>
          <div id="new-repo-btn-container">
            <IonButton id="new-repo-btn" color="success" href={`${baseURL}/new-repo`}>+ New Repository</IonButton>
          </div>
          <div id="sign-in-container">
            <IonButton id="sign-in-btn" color='medium' fill='outline' href={`${baseURL}/sign-in`}>Sign In...</IonButton>
          </div>
          <div id='search-container'>
            <IonSearchbar onKeyUp={search} placeholder="Transaction ID" mode="ios"/>
          </div>
        </div>
      </div>
      <TransitionGroup>
        <CSSTransition key={location.key} classNames='fade' timeout={300}>
          <Switch location={location}>
            <Route path={`${basePath}/new-repo`} render={() => (
              <AppContext.Consumer>
              { ({ newRepoModal, attributions, masterKeys }) =>
                <NewRepoModal context={newRepoModal!} attributions={attributions!} masterKeys={masterKeys!} onClose={() => history.push(baseURL)}/>
              }
              </AppContext.Consumer>
            )}/>
            <Route path={`${basePath}/sign-in`} render={() => (
              <Modal title='Sign In' onClose={() => history.push(match.url)}>
                <p>Coming soon...</p>
                <IonButton onClick={() => history.push(match.url)}>Close</IonButton>
              </Modal>
            )}/>

          </Switch>
        </CSSTransition>
      </TransitionGroup>
    </>
  );
});

const Logo: React.FunctionComponent = () => {
  return ( 
    <>
      <Link id="title" to="/">
        <span className='code'>Code</span><span className='on'>on</span><span className='chain'>chain</span>
      </Link>
    </>
  );
};

export default Banner;