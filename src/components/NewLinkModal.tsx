import './NewLinkModal.css';

import bsv from 'bsv';

import { withRouter, RouteComponentProps } from "react-router";

import React, { useCallback, useContext, useEffect } from 'react';
import UploadModal from './UploadModal';
import { MetanetNode } from "../metanet/metanet-node";
import { useState } from "react";
import { IonLabel } from "@ionic/react";
import { Metanet } from "../metanet/metanet";
import { BProtocol } from "../protocols/b.protocol";
import { BcatProtocol } from "../protocols/bcat.protocol";
import { DirectoryProtocol } from "../protocols/directory.protocol";
import { LinkProtocol } from '../protocols/link.protocol';
import { Attribution } from '../storage/attribution';
import { AppContext, AttributionsContext, NewLinkModalContext } from '../App';

interface NewLinkModalProps extends RouteComponentProps {
  parent: MetanetNode;
  onClose: Function;
  onFilesAdded: Function;
  context: NewLinkModalContext;
  attributions: AttributionsContext;
}

const NewLinkModal = withRouter<NewLinkModalProps>(({history, match, parent, onClose, onFilesAdded}) => {
  const [ xprv, 
          setXprv ] = useState('');
  const [ moneyButtonProps, 
          setMoneyButtonProps ] = useState({} as any);
  const [ message, 
          setMessage ] = useState('');
  const [ txIdMessage, 
          setTxIdMessage ] = useState('');
  const [ txInfo, 
          setTxInfo ] = useState({
            description: '',
            address: '',
            name: '',
            mimeType: '',
            protocols: [] as string[]
          });
  const [ progressBarValue, 
          setProgressBarValue ] = useState(0);
  const [ progressBarIndeterminate, 
          setProgressBarIndeterminate ] = useState(false);
  const [ metanetNode, 
          setMetanetNode ] = useState(null as MetanetNode | null);
  const [ linkASM, 
          setLinkASM ] = useState([] as string[]);

  const {newLinkModal, attributions} = useContext(AppContext);

  const onMasterKey = useCallback((newXprv: string) => {
    setXprv(newXprv);
    setMoneyButtonProps({});
  }, []);

  const onTxIdChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    let txId = e.target.value;

    if (txId) {
      // Extract tx
      const result = txId.match(/[0-9A-Fa-f]{64}/);
      if (!(result && result[0])) {
        setTxIdMessage('Invalid transaction ID');
        return;
      }
      txId = result[0];
      newLinkModal!.setTxId(txId);
      getTxInfo(txId);
    } else {
      setTxIdMessage('');
    }
  };

  const getTxInfo = async (txId: string) => {
    const protocols = await Metanet.getProtocols(txId);

    if (protocols) {
      // Get the first file protocol
      let fileProtocol = protocols.find((protocol: any) => [
        BProtocol.address, 
        BcatProtocol.address, 
        DirectoryProtocol.address].includes(protocol.constructor.address));
      
      // If there isn't a file protocol then just pick the first one
      if (!fileProtocol && protocols.length > 0) {
        fileProtocol = protocols[0];
      }

      let description = '';
      let address = '';
      let name = '';
      let mimeType = '';
      if (fileProtocol) {
        description = fileProtocol.constructor.description;
        address = fileProtocol.constructor.address;
        name = fileProtocol.name;
        mimeType = fileProtocol.mimeType;
      }
      const protocolAddresses = protocols.map(p => p.constructor.address);
      setTxInfo({ description, address, name, mimeType, protocols: protocolAddresses });
      newLinkModal!.setName(name);
    }
  };

  const onFileNameChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    newLinkModal!.setName(e.target.value);
  }

  const onAttributions = (a: Attribution[]) => {
    attributions!.setAttributions(a);
    history.push(match.url);
  }

  const onPrepareOutputs = () => {
    estimateFees();
  };

  const onPayment = (args: any) => {
    const fundingTxId = args.txid;
    setMoneyButtonProps({});
    send(fundingTxId);
  };

  const onError = (arg: any) => {
    console.log('Error', arg);
  };

  const estimateFees = async() => {
    setMessage('Estimating fees...');

    if (xprv) {
      // Transaction will create the root node as well as fund the root
      // so that the .bsvignore and bsvpush.json files can be created
      const masterKey = bsv.HDPrivateKey(xprv);
      const metanetNode = parent.childOrCreate(newLinkModal!.name, masterKey);
      metanetNode.attributions = attributions!.attributions;
      const linkASM = LinkProtocol.toASM(newLinkModal!.txId, newLinkModal!.name, txInfo.protocols, txInfo.mimeType);
      //console.log('linkASM', linkASM);
      await Metanet.createTx(masterKey, null, metanetNode, linkASM);
      const fee = metanetNode.fee;
      console.log(`Fee: ${fee}`);

      const outputs = [{
        to: parent.nodeAddress,
        amount: fee / 1e8,
        currency: 'BSV'
      }];
      console.log('Money Button outputs', outputs);

      setMetanetNode(metanetNode);
      setLinkASM(linkASM);
      setMoneyButtonProps({outputs: outputs});
      setMessage('');
      setProgressBarValue(0);
    }
  };

  const send = async (fundingTxId: string) => {
    if (metanetNode && xprv) {
      setMessage('Sending transaction...');

      try {
        setProgressBarIndeterminate(true);
        await Metanet.waitForUnconfirmedParents(fundingTxId, (message: string) => setMessage(message));

        parent.spentVouts = [];
        const masterKey = bsv.HDPrivateKey(xprv);
        const tx = await Metanet.createTx(masterKey, fundingTxId, metanetNode, linkASM);
        const response = await Metanet.send(tx);
        console.log('Transaction sent, txId: ', response.txid); 
        setMessage(`Waiting for transaction to appear...`);
        await Metanet.waitForTransactionToAppearOnPlanaria(response.txid);
        setMessage(`Transaction sent`);
        newLinkModal!.setTxId('');
        newLinkModal!.setName('');
        onFilesAdded();
      } catch (error) {
        console.log('Error sending transaction', error); 
        setMessage(`Error: ${error}`);
      }
      setProgressBarIndeterminate(false);
    }
  }

  const uploadButtonDisabled = (): boolean => {
    return !(newLinkModal!.txId && newLinkModal!.name && !moneyButtonProps.outputs);
  }

  useEffect(() => {
    if (newLinkModal!.txId) {
      getTxInfo(newLinkModal!.txId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <UploadModal 
        parent={parent} 
        title='New Link' 
        uploadButtonText='Create Link' 
        moneyButtonProps={moneyButtonProps}
        message={message}
        uploadButtonDisabled={uploadButtonDisabled}
        progressBarValue={progressBarValue}
        progressBarIndeterminate={progressBarIndeterminate}
        onMasterKey={(xprv: string) => onMasterKey(xprv)}
        onClose={() => onClose()}
        onPrepareOutputs={() => onPrepareOutputs()}
        onPayment={(args: any) => onPayment(args)}
        onError={(arg: any) => onError(arg)}
        onAttributions={(a: Attribution[]) => onAttributions(a)}>

        <div className='form-grid'>
          <div className='label'>Create a link to an existing transaction:</div>
          <div><input id='txid-input' defaultValue={newLinkModal!.txId} onChange={(e) => onTxIdChanged(e)} className='monospace' placeholder='Transaction ID (64 digit hex)' /></div>
          {txInfo.address &&
          <>
            <div className='label'>Protocol:</div> <div>{txInfo.description} <span className='monospace'>{txInfo.address}</span></div>
            <div className='label'>MIME Type:</div> <div>{txInfo.mimeType}</div>
          </>
          }
          <div className='label'><IonLabel>Name: </IonLabel></div>
          <div><input id='name-input' onChange={(e) => onFileNameChanged(e)} defaultValue={newLinkModal!.name} placeholder='File name' /></div>
        </div>

        {txIdMessage && <p>{txIdMessage}</p>}

      </UploadModal>
    </>
  );
});

export default NewLinkModal;