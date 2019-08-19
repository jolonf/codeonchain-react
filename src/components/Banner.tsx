import { IonButton, IonSearchbar } from '@ionic/react';
import React, { useState } from 'react';
import NewRepoModal from './NewRepoModal';
import './Banner.css';
import '../theme/variables.scss';

const Banner: React.FunctionComponent = () => {

  const [newRepoOpen, setNewRepOpen] = useState(false);

  function newRepository(e: Event) {
    e.preventDefault();
    setNewRepOpen(true);
  }

  function search(e: KeyboardEvent) {
    if (e.keyCode === 13) {
      e.preventDefault();
      const value = (e.target as HTMLInputElement).value;
      if (value.length === 64) {
        window.location.href = `/tx/${(e.target as HTMLInputElement).value}`;
      }
    }
  }

  return (
    <>
      <div id='banner'>
        <div id='title-container'>
          <Logo />
          <span id='upload'>Upload a repository to metanet using <a href="https://github.com/jolonf/bsvpush">bsvpush</a></span>
        </div>
        <div id="new-repo-btn-container">
          <IonButton id="new-repo-btn" color="success" onClick={newRepository}>+ New Repository</IonButton>
        </div>
        <div id='search-container'>
          <IonSearchbar onKeyUp={search} placeholder="Transaction ID" mode="ios"/>
        </div>
      </div>
      <NewRepoModal isOpen={newRepoOpen} onClose={() => {setNewRepOpen(false)}}/>
    </>
  );
};

const Logo: React.FunctionComponent = () => {
  return ( 
    <>
      <span id='title'>
        <a id="title" href="/">
          <span className='code'>Code</span><span className='on'>on</span><span className='chain'>chain</span>
        </a>
      </span>
    </>
  );
};

export default Banner;