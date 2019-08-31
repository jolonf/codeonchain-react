import './ProtocolView.css';

import React from 'react';
import { IonGrid, IonRow, IonCol } from '@ionic/react';

interface ProtocolProps {
  protocol: any;
}

const ProtocolView: React.FunctionComponent<ProtocolProps> = ({protocol}) => {
  return (
    <>
      <div className='protocol-container'>
        <div className='protocol-description'>
          <IonGrid>
            <IonRow>
              <IonCol>{protocol.constructor.description}</IonCol>
              <IonCol className='right-align'><span className='monospace protocol-address'>{protocol.constructor.address}</span></IonCol>
            </IonRow>
          </IonGrid>
        </div>
        <IonGrid className='protocol-keys monospace'>
          {Object.keys(protocol).map((key, i) => {
            if (key !== 'description' && key !== 'address') {
              let value = protocol[key];
              if (Array.isArray(value)) {
              value = value.map((v, index) => <span key={index}>[{index}] {v}<br/></span>);
              }
              return (
                <IonRow key={i} className='key-row'>
                  <IonCol size='3' className='label key'>{key}</IonCol>
                  <IonCol>{value}</IonCol>
                </IonRow>
              );
            }
            return null;
          })}
        </IonGrid>
      </div>
    </>
  );
}

export default ProtocolView;