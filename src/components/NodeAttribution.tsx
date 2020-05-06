import './NodeAttribution.css';

import React from "react";
import { Attribution } from "../storage/attribution";

interface NodeAttributionProps {
  attributions: Attribution[];
}

class NodeAttribution extends React.Component<NodeAttributionProps> {
  render() {
    return (
      <> 
        <div className='node-attribution'>
          <div className='by'>By:</div>
          {
            this.props.attributions.map((attribution, i) => {
              let name = <>{attribution.name}</>;
              if (attribution.contact.startsWith('http')) {
                name = <a className='creator-link' href={attribution.contact} title={`${attribution.sponsor}: ${attribution.currency} ${attribution.defaultAmount}`} target='_blank' rel="noopener noreferrer">{attribution.name}</a>;
              }
              return <div className='creator' key={i}>{name}</div>;
            })
          }
        </div>
      </>
    );
  }
}

export default NodeAttribution;