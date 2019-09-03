import { readAsText } from 'promise-file-reader';

import React from "react";
import { Link } from "react-router-dom";
import { IonGrid, IonRow, IonCol, IonButton, IonToast } from '@ionic/react';

import { MasterKeyEntry } from '../storage/master-key-storage';
import { MasterKeysContext } from '../App';

interface MyReposProps {
  masterKeys: MasterKeysContext;
}
class MyRepos extends React.Component<MyReposProps> {

  readonly state = {
    loaded: false,
    message: {message: '', color: 'dark', duration: 1000, showCloseButton: false}
  }

  importMasterKeys() {
    const fileInput = document.getElementById('hidden-file-input');
    fileInput!.click();
  }

  async onFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      const json = await readAsText(e.target!.files![0]);
      this.props.masterKeys.importFromJSON(json);
      this.setState({
        message: {
          message: `Master keys imported`,
          color: 'dark',
          duration: 2000,
          showCloseButton: false  
        }
      })
    } catch (e) {
      this.setState({
        message: {
          message: `Error reading file: ${e.toString()}`,
          color: 'danger',
          duration: 0,
          showCloseButton: true
        }
      });
    }
  }

  exportMasterKeys() {
    const a = document.getElementById('hidden-export-link');

    if (a) {
      this.setState({loaded: true});
      const masterKeysJSON = JSON.stringify(this.props.masterKeys.masterKeys, null, 2);
      a.setAttribute('href', URL.createObjectURL(new File([masterKeysJSON], 'masterkeys.json', { type: 'application/json' })));
      a!.click();
    }
  };

  render() {
    return (
      <>
        <div className='repos'>
          {this.props.masterKeys.masterKeys &&
            <>
              <IonGrid>
                {[...this.props.masterKeys.masterKeys].reverse().map((entry: MasterKeyEntry, index: number) => (
                  <IonRow key={index} className="ion-align-items-center">
                    <IonCol sizeMd='3' sizeSm='4' sizeXs='6'><Link to={'/tx/' + entry.txId}>{entry.repoName}</Link></IonCol>
                    <IonCol sizeMd='9' sizeSm='8' sizeXs='6' className='monospace grey'>{entry.txId}</IonCol>
                  </IonRow>
                ))}
              </IonGrid>
            </>
          }
          {!this.props.masterKeys.masterKeys && this.state.loaded &&
            <div className='no-repos'>
              <p>Create a new repo to get started</p>
              <p><IonButton href='/new-repo' color='success'>+ New Repository</IonButton></p>
              <p>Or view one of the <Link to='/featured-repos'>featured</Link> or <Link to='/recent-repos'>recently</Link> added repos.</p>
            </div>
          }
        </div>
        <div className='flex-center'>
          <IonButton onClick={() => this.importMasterKeys()} color='medium' size='small'>Import...</IonButton>
          <IonButton onClick={() => this.exportMasterKeys()} color='medium' disabled={!this.props.masterKeys.masterKeys} size='small'>Export...</IonButton>
          <a id='hidden-export-link' href='/' download='masterkeys.json'> </a>
          <input onChange={(e) => this.onFilesSelected(e)} id='hidden-file-input' type='file' />
        </div>
        <IonToast isOpen={!!this.state.message.message} onDidDismiss={() => this.setState({message: {message: '', color: 'dark', duration: 0, showCloseButton:false}})} message={this.state.message.message} duration={this.state.message.duration} color={this.state.message.color} showCloseButton={this.state.message.showCloseButton} />
      </>
    );
  }
}

export default MyRepos;