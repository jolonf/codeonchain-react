import { readAsText } from 'promise-file-reader';

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { IonGrid, IonRow, IonCol, IonButton, IonToast } from '@ionic/react';

import { MasterKeyStorage, MasterKeyEntry } from '../storage/master-key-storage';

const MyRepos = () => {

  const [masterKeys, setMasterKeys] = useState();
  const [loaded, setLoaded] = useState(false);
  const [exportObjectUrl, setExportObjectUrl] = useState();
  const [message, setMessage] = useState({message: '', color: 'dark', duration: 1000, showCloseButton: false});

  useEffect(() => {
    let masterKeys = MasterKeyStorage.getMasterKeys();
    if (masterKeys) {
      masterKeys = masterKeys.reverse();
    }
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
            <IonGrid>
              {masterKeys.map((entry: MasterKeyEntry, index: number) => (
                <IonRow key={index} className="ion-align-items-center">
                  <IonCol sizeMd='3' sizeSm='4' sizeXs='6'><Link to={'/tx/' + entry.txId}>{entry.repoName}</Link></IonCol>
                  <IonCol sizeMd='9' sizeSm='8' sizeXs='6' className='monospace grey'>{entry.txId}</IonCol>
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

export default MyRepos;