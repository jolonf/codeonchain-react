import './NewLinkModal.css';

import bsv from 'bsv';

import { withRouter, RouteComponentProps } from "react-router";

import React from 'react';
import UploadModal from './UploadModal';
import { MetanetNode } from "../metanet/metanet-node";
import { useState } from "react";
import { Metanet } from "../metanet/metanet";
import { Attribution } from '../storage/attribution';

interface DeleteModalProps extends RouteComponentProps {
  parent: MetanetNode;
  metanetNode: MetanetNode;
  onClose: Function;
  onFilesAdded: Function;
}

const DeleteModal = withRouter<DeleteModalProps>(({history, match, parent, metanetNode, onClose, onFilesAdded}) => {
  const [ xprv, 
          setXprv ] = useState('');
  const [ moneyButtonProps, 
          setMoneyButtonProps ] = useState({} as any);
  const [ message, 
          setMessage ] = useState('');
  const [ progressBarValue, 
          setProgressBarValue ] = useState(0);
  const [ progressBarIndeterminate, 
          setProgressBarIndeterminate ] = useState(false);

  const onMasterKey = (newXprv: string) => {
    setXprv(newXprv);
    setMoneyButtonProps({});
  };

  const onAttributions = (a: Attribution[]) => {
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
      const masterKey = bsv.HDPrivateKey(xprv);
      await Metanet.createTx(masterKey, null, metanetNode, []);
      const fee = metanetNode.fee;
      console.log(`Fee: ${fee}`);

      const outputs = [{
        to: parent.nodeAddress,
        amount: fee / 1e8,
        currency: 'BSV'
      }];
      console.log('Money Button outputs', outputs);

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
        const tx = await Metanet.createTx(masterKey, fundingTxId, metanetNode, []);
        const response = await Metanet.send(tx);
        console.log('Transaction sent, txId: ', response.txid); 
        setMessage(`Waiting for transaction to appear...`);
        await Metanet.waitForTransactionToAppearOnPlanaria(response.txid);
        setMessage(`Transaction sent`);
        onFilesAdded();
      } catch (error) {
        console.log('Error sending transaction', error); 
        setMessage(`Error: ${error}`);
      }
      setProgressBarIndeterminate(false);
    }
  }

  const uploadButtonDisabled = (): boolean => {
    return !!moneyButtonProps.outputs;
  }

  return (
    <>
      <UploadModal 
        parent={parent} 
        title='Delete' 
        uploadButtonText='Delete' 
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

        <p>Deleting the file/folder will replace it with an empty Metanet Node.</p>

      </UploadModal>
    </>
  );
});

export default DeleteModal;