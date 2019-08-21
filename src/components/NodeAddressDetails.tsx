
import React from "react";
import { IonButton } from "@ionic/react";
import { MetanetNode } from "../metanet/metanet_node";
import { Metanet } from "../metanet/metanet";

interface NodeAddressDetailsProps {
  node: MetanetNode;
  onClose: Function;
}

class NodeAddressDetails extends React.Component<NodeAddressDetailsProps> {

  state = {
    sats: 0
  }

  componentDidUpdate(prevProps: NodeAddressDetailsProps) {
    if (prevProps.node !== this.props.node) {
      this.updateBalance();
    }
  }

  render() {
    return (
      <div>
        <p>Node address: <span className={'monospace grey'}>{this.props.node.nodeAddress}</span></p>
        <p>Funds: {this.state.sats} sats</p>
        <p>If there are funds in this address, you can send them to another address:</p>
        <p><input type='text' placeholder='BSV address'/> <IonButton>Send</IonButton></p>
        <p><IonButton onClick={() => {this.props.onClose()}}>Close</IonButton></p>
      </div>
    );
  }

  componentDidMount() {
    this.updateBalance();
  }

  async updateBalance() {
    if (this.props.node.nodeAddress) {
      const sats = await Metanet.addressBalance(this.props.node.nodeAddress);
      //console.log(`sats: ${sats}`);
      this.setState({sats: sats});
    }
  }
}

export default NodeAddressDetails;