
import React from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import { MetanetNode } from '../metanet/metanet-node';

interface FileDataProps extends RouteComponentProps {
  metanetNode: MetanetNode;
  data: string | null;
}
const FileData = withRouter<FileDataProps>(({location, metanetNode, data}) => {
  if (!data) {
    return null;
  }

  // Returns ?query params as an object where each property is a param name.
  const getQueryParams = () => {
    const parts = location.search.substring(1).split('&');
    return parts.map(p => {
      const tokens = p.split('=');
      const param = {} as any;
      param[tokens[0]] = tokens[1];
      return param;
    }).reduce((result, param) => ({...result, ...param}), {} as any);
  };

  const handleVideoMounted = (element: HTMLVideoElement) => {
    if (element !== null) {
      const params = getQueryParams();
      if (params.t) {
        element.currentTime = parseInt(params.t);
      }
    }
  };

  let fileText = null;
  let img = null;
  let svg = null;
  let video = null;

  if (data) {
    if (metanetNode.mimeType.startsWith('video') || metanetNode.mimeType.startsWith('audio')) {
      video = <div className='video-container'>
        <video className='video-data' controls src={data} ref={handleVideoMounted} />
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