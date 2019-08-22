import { IonButton, IonSearchbar } from '@ionic/react';
import React from 'react';
import NewRepoModal from './NewRepoModal';
import './Banner.css';
import '../theme/variables.scss';
import '../globals.scss';
import { Link, withRouter, Route, Switch } from 'react-router-dom';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

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
          <span id='upload'>Upload a repository to metanet using <a href="https://github.com/jolonf/bsvpush">bsvpush</a></span>
        </div>
        <div id="new-repo-btn-container">
          <IonButton id="new-repo-btn" color="success" href={`${baseURL}/new-repo`}>+ New Repository</IonButton>
        </div>
        <div id='search-container'>
          <IonSearchbar onKeyUp={search} placeholder="Transaction ID" mode="ios"/>
        </div>
      </div>
      <TransitionGroup>
        <CSSTransition key={location.key} classNames='fade' timeout={300}>
          <Switch location={location}>
            <Route path={`${basePath}/new-repo`} render={() => (
              <NewRepoModal onClose={() => history.push(baseURL)}/>
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
      <span id='title'>
        <Link id="title" to="/">
          <span className='code'>Code</span><span className='on'>on</span><span className='chain'>chain</span>
        </Link>
      </span>
    </>
  );
};

export default Banner;