import MoneyButton from '@moneybutton/react-money-button';

import React from 'react';
import { RouteComponentProps, withRouter } from "react-router";
import { Link } from "react-router-dom";

import { MetanetNode } from '../metanet/metanet-node';
import { Repo } from '../metanet/repo';
import { IonIcon } from '@ionic/react';
import { link } from 'ionicons/icons';

interface NodeBannerProps extends RouteComponentProps {
  metanetNode: MetanetNode;
  repo: Repo | null;
}
const NodeBanner = withRouter<NodeBannerProps>(({metanetNode, repo, match}) => {

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
  let github = null;
  let sponsor = null;
  if (repo) {
    if (repo.version) {
      version = <img className='version-badge' alt={repo.version} src={`https://img.shields.io/badge/-${repo.version}-lightgrey`}/>;
    }
    if (repo.github) {
      github = <a href={repo.github}><img className='version-badge' alt='github' src={`https://img.shields.io/badge/-github-yellow`}/></a>;
    }
    if (metanetNode.isRoot() && repo.sponsor && repo.sponsor.to) {
      console.log(repo.sponsor);
      sponsor = <MoneyButton {...repo.sponsor} editable={true} />;
    }
  }

  return (
    <div id='node-banner'>
      <div id='node-banner-display'>
        <div id='node-title'>
          <div id='node-name'>
            <span id='node-name'> {backButton} {nodeName} {metanetNode.isDirectory && metanetNode.isDirectory() && (metanetNode.parentTxId !== 'NULL') && ' /'} {metanetNode.link && <IonIcon icon={link.ios} />} {version}{github}</span>
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