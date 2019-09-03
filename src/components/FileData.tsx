
import React from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import { MetanetNode } from '../metanet/metanet-node';

interface FileDataProps extends RouteComponentProps {
  metanetNode: MetanetNode;
  data: string | null;
}
const FileData = withRouter<FileDataProps>(({metanetNode, data}) => {
  if (!data) {
    return null;
  }

  let fileText = null;
  let img = null;
  let svg = null;
  let video = null;

  if (data) {
    if (metanetNode.mimeType.startsWith('video') || metanetNode.mimeType.startsWith('audio')) {
      video = <div className='video-container'>
        <video className='video-data' controls src={data} />
      </div>
    } else if (metanetNode.mimeType === 'image/svg+xml') {
      svg = (
        <div id='svg-data' dangerouslySetInnerHTML={{__html: data}}>
        </div>
      );
    } else if (metanetNode.mimeType.startsWith('image/')) {
      img = (
        <div id='img-data-container'>
            <img id="img-data" src={data} alt={metanetNode.name} />
        </div>
      );
    } else {
      fileText = (
        <pre id='text'>{data}</pre>
      );
    }
  }

  return (
    <div id='file-data'>
      {fileText}
      {img}
      {svg}
      {video}
    </div>
  );
});

export default FileData;