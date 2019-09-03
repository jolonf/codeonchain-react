import './NodeChildren.css';

import React, { useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import { Link } from 'react-router-dom';

import { IonRow, IonCol, IonIcon, IonGrid, IonButton } from '@ionic/react';
import { link, folder, document, cloudUpload } from 'ionicons/icons';

import { MetanetNode } from '../metanet/metanet-node';
import { FileTree } from '../metanet/file-tree';

interface NodeChildrenProps extends RouteComponentProps {
  metanetNode: MetanetNode;
  children: MetanetNode[];
}
const NodeChildren = withRouter<NodeChildrenProps>(({metanetNode, children, history, match}) => {

  const [highlight, setHighlight] = useState(false);

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setHighlight(true);
  }

  function onDragLeave(e: React.DragEvent<HTMLDivElement>) {
    setHighlight(false);
  }

  async function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.stopPropagation();
    e.preventDefault();
    setHighlight(false);
    if (e.dataTransfer.items) {
      const fileTrees = await FileTree.itemListToFileTrees(e.dataTransfer.items);
      if (fileTrees.length > 0) {
        history.push({
          pathname: `${match.url}/add-files`,
          state: {fileTrees: fileTrees}
        });
      }
    }
  }

  const rows = children.map((child, index) => {
    const icon = child.isDirectory() || child.isLinkToDirectory() ? folder : document;
    child.parent = metanetNode;
    return (
      <IonRow key={index} className='children-row'>
        <IonCol size='5' className='col-name'>
          <IonIcon icon={icon} color={child.isLink() ? 'primary': 'medium'}/> <Link className={`child-link ${child.isLink() && 'italic'}`} to={{pathname: '/tx/' + child.nodeTxId, state: {node: child}}}>{child.name}</Link> 
          {child.isLink() && <IonIcon icon={link.ios}/>}
        </IonCol>
        <IonCol class='monospace' size='7'><span className='col-txid'>{child.nodeTxId}</span></IonCol>
      </IonRow>
    );
  });

  return (
    <>
      <div id='children-container' className={highlight ? 'children-drag-highlight' : ''} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}>
        {children.length > 0 &&
        <IonGrid className='children-grid'>
          {rows}
        </IonGrid>
        }
        {children.length === 0 &&
        <div className='no-children-container'>
            <p>Folder is empty</p>
            <IonIcon icon={cloudUpload} color='medium' size='large' />
            <p id='drop-files-message'>Drop files here</p>
            <p><IonButton href={match.url + '/add-files'}><IonIcon slot='start' icon={document}  />Add Files...</IonButton></p>
        </div>
        }
      </div>
    </>
  );
});

export default NodeChildren;