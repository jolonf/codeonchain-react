import './NodeAddressDetails.css';

import React from "react";
import { IonButton, IonProgressBar, IonSpinner } from "@ionic/react";
import { MetanetNode } from "../metanet/metanet-node";
import { Metanet } from "../metanet/metanet";
import { MasterKeyStorage } from "../storage/master-key-storage";

import bsv from 'bsv';
import ProtocolView from './ProtocolView';

interface NodeAddressDetailsProps {
  node: MetanetNode;
  onClose: Function;
}

class NodeAddressDetails extends React.Component<NodeAddressDetailsProps> {

  initialState = {
    sats: 0,
    sendAddress: '',
    masterKeyXprv: '',
    message: '',
    sending: false,
    updatingBalance: true,
    protocols: [] as any[]
  };

  state = this.initialState;

  render() {
    return (
      <>
        <div>
          <p>Node address: <span className={'monospace grey'}>{this.props.node.nodeAddress}</span></p>
          <p>Funds: {this.state.updatingBalance ? <IonSpinner /> : this.state.sats} sats <IonButton onClick={() => this.updateBalance()}>Refresh</IonButton></p>
          <p>If there are funds in this address, you can send them to another address:</p>
          <p>
            <input type='text' placeholder='BSV address' onChange={(e) => this.setState({sendAddress: e.target.value})}/> 
            <IonButton disabled={this.state.sats === 0 || !this.state.sendAddress || this.state.sending || !this.state.masterKeyXprv} onClick={() => {this.onSendButton()}}>Send</IonButton>
          </p>
          <p>
            Master Key:
          </p>
          <p>
            <input type='text' className='monospace' placeholder='Master Key xprv' value={this.state.masterKeyXprv} onChange={(e) => this.setState({masterKeyXprv: e.target.value})}/> 
          </p>
        </div>
        <div>
          {this.state.message &&
          <p>{this.state.message}</p>}
          {this.state.sending &&
          <IonProgressBar type='indeterminate'/>}
        </div>
        <div>
          <h4>Protocols:</h4>
          <div className='protocols'>
            {this.state.protocols.map((protocol, i) => <ProtocolView key={i} protocol={protocol} />)}
          </div>
        </div>
        <div id='buttons'>
          <p><IonButton onClick={() => {this.props.onClose()}}>Close</IonButton></p>
        </div>
      </>
    );
  }

  async componentDidMount() {
    this.updateBalance();
    this.updateProtocols();
  }

  componentDidUpdate(prevProps: NodeAddressDetailsProps) {
    if (prevProps.node !== this.props.node) {
      this.setState(this.initialState);
      this.updateBalance();
      this.updateProtocols();
    }
  }

  async updateBalance() {
    if (this.props.node.nodeAddress) {
      this.setState({updatingBalance: true});

      const root = await Metanet.getRoot(this.props.node);
      if (root) {
        const masterKeyEntry = MasterKeyStorage.getMasterKeyEntry(root.nodeAddress);
        if (masterKeyEntry) {
          this.setState({masterKeyXprv: masterKeyEntry.masterKey});
        }
      }

      const sats = await Metanet.addressBalance(this.props.node.nodeAddress);
      //console.log(`sats: ${sats}`);
      this.setState({sats: sats});
      this.setState({updatingBalance: false});
    }
  }

  async updateProtocols() {
    const protocols = await Metanet.getProtocols(this.props.node.nodeTxId);
    console.log(protocols);
    if (protocols) {
      this.setState({protocols: protocols});
    }
  }

  async onSendButton() {
    this.setState({sending: true, messsage: 'Sending transaction...'});
    const masterKey = bsv.HDPrivateKey(this.state.masterKeyXprv);
    if (masterKey) {
      const tx = await Metanet.refundTx(masterKey, this.props.node.derivationPath, this.state.sendAddress);
      try {
        const response = await Metanet.send(tx);
        if (response.txid) {
          const message = `Transaction sent: ${response.txid}`;
          this.setState({message: message, sending: false});
          // Wait for transaction to appear on bitindex before updating the balance
          await Metanet.waitForTransactionToAppear(response.txid);
          this.updateBalance();
        }
      } catch (e) {
        console.log(e.toString());
        this.setState({message: `Error sending transaction: ${e.toString().substring(0, 200)}`});
      }
    } else {
      alert('No master key found in local storage');
    }
    this.setState({sending: false});
  }
}

export default NodeAddressDetails;