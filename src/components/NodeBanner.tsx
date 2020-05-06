import MoneyButton from '@moneybutton/react-money-button';

import React from 'react';
import { RouteComponentProps, withRouter } from "react-router";
import { Link } from "react-router-dom";

import { MetanetNode } from '../metanet/metanet-node';
import { IonIcon } from '@ionic/react';
import { link } from 'ionicons/icons';

interface NodeBannerProps extends RouteComponentProps {
  metanetNode: MetanetNode;
}
const NodeBanner = withRouter<NodeBannerProps>(({metanetNode, match}) => {

  let backButton = null;
  if (metanetNode.parentTxId && metanetNode.parentTxId !== 'NULL') {
    backButton = (
    <>
      <Link to={{pathname: '/tx/' + metanetNode.parentTxId, state: {node: metanetNode.parent}}} id='parent-back'>{metanetNode.parent ? `${metanetNode.parent.name}` :'<'}</Link> {metanetNode.parent && ' /'}
    </>);
  }

  let nodeName = <>{metanetNode.name}</>;

  if (metanetNode.link) {
    if (metanetNode.isLinkToMetanet && metanetNode.isLinkToMetanet()) {
      nodeName = <Link to={{pathname: '/tx/' + metanetNode.link.txId}}>{metanetNode.name}</Link>;
    } else {
      nodeName = <a href={`https://whatsonchain.com/tx/${metanetNode.link.txId}`} target='_blank' rel='noopener noreferrer'>{metanetNode.name}</a>;
    }
  }

  let version = null;
  let website = null;
  let github = null;
  let sponsor = null;
  if (metanetNode.repo) {
    if (metanetNode.repo.version && metanetNode.repo.version.trim().length > 0) {
      version = <img className='version-badge' alt={metanetNode.repo.version} src={`https://img.shields.io/badge/-${metanetNode.repo.version}-lightgrey`}/>;
    }
    if (metanetNode.repo.website && metanetNode.repo.website.startsWith('http')) {
      website = <a href={metanetNode.repo.website} target='_blank' rel="noopener noreferrer"><img className='version-badge' alt='github' src={`https://img.shields.io/badge/-website-yellow`}/></a>;
    }
    if (metanetNode.repo.github && metanetNode.repo.github.startsWith('http')) {
      github = <a href={metanetNode.repo.github} target='_blank' rel="noopener noreferrer"><img className='version-badge' alt='github' src={`https://img.shields.io/badge/-github-blue`}/></a>;
    }
  } 
  
  if (metanetNode.attributions.length > 0) {
    const outputs = metanetNode.attributions.map(attribution => { 
      const output = {
        amount: attribution.defaultAmount,
        currency: attribution.currency
      } as any;

      // Determine whether to use the address or paymail field
      if (attribution.sponsor.includes('@')) {
        output.paymail = attribution.sponsor;
      } else {
        output.address = attribution.sponsor;
      }
      return output;
    });

    //console.log('attribution outputs', outputs);
    sponsor = <MoneyButton outputs={outputs} editable={false} label='Tip' successMessage='Thanks!' />;
  }

  return (
    <div id='node-banner'>
      <div id='node-banner-display'>
        <div id='node-title'>
          <div id='node-name'>
            <span id='node-name'> {backButton} {nodeName} {metanetNode.isDirectory && metanetNode.isDirectory() && (metanetNode.parentTxId !== 'NULL') && ' /'} {metanetNode.link && <IonIcon icon={link.ios} />} {version}{github}{website}</span>
          </div>
          <div id='node-txid'>
              <Link id='node-publickey' to={`${match.url}/details`}>{metanetNode.nodeAddress}</Link><br />
              <span id='node-txid'>{metanetNode.nodeTxId}</span>
          </div>
        </div>
        <div id='money-button-container'>
          {sponsor}
        </div>
      </div>
    </div>
  );
});

export default NodeBanner;