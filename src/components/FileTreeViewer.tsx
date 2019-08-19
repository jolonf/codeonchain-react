import React from "react";

import { FileTree } from '../metanet/FileTree';
import { IonIcon } from "@ionic/react";
import { folder, document } from "ionicons/icons";

import './FileTreeViewer.css';

interface FileTreeViewerProps {
  fileTrees: FileTree[]
}

export class FileTreeViewer extends React.Component<FileTreeViewerProps> {

  render() {

    const items = this.props.fileTrees.map((fileTree, i) => {
      return <li key={i}>
        <IonIcon icon={fileTree.isDirectory() ? folder : document} color='medium'/> {fileTree.name}
        {fileTree.isDirectory() ? <FileTreeViewer fileTrees={fileTree.children}/> : null}
      </li>;
    })

    return <ul>
      {items}
    </ul>;
  }
  
}