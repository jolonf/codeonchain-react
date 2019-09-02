import './UploadModal.css';

import MoneyButton from '@moneybutton/react-money-button';

import React, { useEffect } from 'react';
import { withRouter, RouteComponentProps, Switch, Route } from "react-router";
import Modal from "./Modal";
import { useState } from "react";
import { IonButton, IonProgressBar } from "@ionic/react";
import { MetanetNode } from '../metanet/metanet-node';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import EditAttribution from './EditAttribution';
import { MasterKeyStorage } from '../storage/master-key-storage';
import { Attribution } from '../storage/attribution';


interface UploadModalProps extends RouteComponentProps {
  parent: MetanetNode;
  title: string;
  uploadButtonText: string;
  moneyButtonProps: any;
  message: string;
  uploadButtonDisabled(): boolean;
  progressBarValue: number;
  progressBarIndeterminate: boolean;
  onMasterKey: (xprv: string) => void;
  onClose: Function;
  onPrepareOutputs: Function;
  onPayment: Function;
  onError: Function;
  onAttributions: Function;
}

const UploadModal = withRouter<UploadModalProps>(({
    children, 
    history, 
    location, 
    match, 
    parent, 
    title, 
    uploadButtonText, 
    moneyButtonProps, 
    message, 
    uploadButtonDisabled, 
    progressBarValue, 
    progressBarIndeterminate,
    onMasterKey, 
    onClose, 
    onPrepareOutputs, 
    onPayment, 
    onError,
    onAttributions}) => {
  const [xprivkey, setXprivKey] = useState('');
  const [internalUploadButtonDisabled, setInternalUploadButtonDisabled] = useState(true);

  useEffect(() => {

    const getMasterKeyFromStorage = async () => {
      const masterKeyEntry = await MasterKeyStorage.getMasterKeyEntryForChild(parent);
  
      if (masterKeyEntry) {
        setXprivKey(masterKeyEntry.masterKey);
        onMasterKey(masterKeyEntry.masterKey);
        setInternalUploadButtonDisabled(false);
      } else {
        console.log('MasterKey entry not found in local storage');
      }  
    };  

    if (parent.nodeAddress) {
      getMasterKeyFromStorage();
    }
// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parent]);

  const onMasterKeyChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    const xprv = e.target.value;
    setXprivKey(xprv);
    if (xprv && xprv.startsWith('xprv')) {
      setInternalUploadButtonDisabled(false);
      onMasterKey(xprv);
    }
  };

  return (
    <>
      <Modal title={title} onClose={onClose}>
        <div className='form-grid'>
          <div className='label'>Master key: </div>
          <div><input type='text' id='repo-master-key' defaultValue={xprivkey} onChange={onMasterKeyChanged} size={64} placeholder='Enter the master key for this repository' /></div>
        </div>
        {children}
        <div className='upload-buttons'>
          <div className='attribution-container'>
            <IonButton href={`${match.url}/attribution`} className='attribution-button' color='dark' fill='outline' disabled={false}>Attribution...</IonButton>
          </div>
          <div>
            <IonButton onClick={() => onClose()} >Close</IonButton>
            <IonButton onClick={() => onPrepareOutputs()} className='upload-button' disabled={uploadButtonDisabled() || internalUploadButtonDisabled} color='success' >{uploadButtonText}</IonButton>
          </div>
          <div className='empty-space' />
        </div>
        {(moneyButtonProps.outputs || message || progressBarValue > 0 || progressBarIndeterminate) &&
        <div id='buttons'>
          {moneyButtonProps.outputs &&
            (
              <div id='dialog-money-button-container'>
                <p>
                  Swipe Money Button to upload files:
                </p>
                <div id='money-button-encapsulator'>
                  <MoneyButton 
                    disabled={!moneyButtonProps.outputs}
                    label='Create'
                    successMessage='Funded'
                    buttonId={parent.nodeTxId}
                    clientIdentifier='3fb24dea420791729b4d9b39703c6339'
                    type='buy'
                    onPayment={(args: any) => onPayment(args)}
                    onError={(args: any) => onError(args)}
                  {...moneyButtonProps} editable={false} />
                </div>
              </div>
            )
          }
          {message &&
          <p>
            {message}
          </p>}
          {(progressBarValue > 0 || progressBarIndeterminate) &&
          <IonProgressBar value={progressBarValue} type={progressBarIndeterminate ? 'indeterminate' : 'determinate'}/>}
        </div>
        }
      </Modal>
      <TransitionGroup>
        <CSSTransition key={location.key} classNames='fade' timeout={300}>
          <Switch location={location}>
            <Route path={`${match.path}/attribution`} render={() => (
              <Modal title='Edit Attribution' onClose={() => history.push(match.url)}>
                <EditAttribution onClose={() => history.push(match.url)} onAttributions={(a: Attribution[]) => onAttributions(a)} />
              </Modal>
            )}/>
          </Switch>
        </CSSTransition>
      </TransitionGroup>
    </>
  );
});

export default UploadModal;