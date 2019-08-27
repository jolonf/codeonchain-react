import './EditAttribution.css';

import React from "react";
import { IonCard, IonButton, IonInput, IonCardContent, IonCardHeader, IonCardTitle, IonCheckbox, IonLabel, IonAlert } from "@ionic/react";
import { Attribution } from '../storage/attribution';

interface EditAttributionProps {
  onClose: Function;
}

class EditAttribution extends React.Component<EditAttributionProps> {

  state = {
    attributionList: [] as Attribution[],
    selectedAttributionIndex: -1,
    showDeleteAttributionAlert: false
  }

  render() {

    const slides = this.state.attributionList.map((attribution, i) => (
      <div key={i} className='attribution-slide'>
        <IonCard className={`attribution-card ${attribution.include ? '' : 'not-included'}`}>
          <IonCardHeader>
            <div className='center'>
              <IonCheckbox checked={attribution.include} onIonChange={(e) => this.onIncludeCheckbox(e, i)} mode='ios' />
            </div>
            <IonCardTitle className={`${attribution.include ? '' : 'not-included'}`}>
              <IonInput placeholder='Name'></IonInput>
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent className='attribution-content'>
            <IonInput placeholder='Contact (Web address, email, etc)'/>
            <IonInput placeholder='Role'/>
            <IonInput placeholder='License'/>
            <IonInput placeholder='Paymail or BSV address'/>
            <IonInput placeholder='Amount' type='number'/>
            <IonInput placeholder='Currency'/>
            <div className='center'>
              <IonButton className='delete-attribution' onClick={() => {this.onDeleteAttributionButton(i)}} color='medium' fill='outline'>Delete</IonButton>
            </div>
          </IonCardContent>
        </IonCard>
      </div>)
    );

    return (
      <>
        <div className='attribution-slides'>
          {slides}
          <div key={this.state.attributionList.length} className='attribution-slide'>
            <IonCard className='attribution-card'>
                <div className='create-new-flex'>
                  <IonButton onClick={() => {this.onCreateNewButton()}} fill='outline'>Create New</IonButton>
                </div>
            </IonCard>
          </div>
        </div>
        <div>
          <IonCheckbox id='save-checkbox' /> <IonLabel>Save in local storage</IonLabel>
        </div>
        <IonAlert 
          isOpen={this.state.showDeleteAttributionAlert}
          onDidDismiss={() => this.setState({showDeleteAttributionAlert: false})}
          header='Delete Attribution'
          message='Remove attribution? This will also remove the attribution from local storage.'
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              handler: () => this.setState({showDeleteAttributionAlert: false})
            }, {
              text: 'Delete',
              handler: () => this.deleteSelectedAttribution()
          }]}
        />
      </>
    );
  }

  onCreateNewButton() {
    const attribution = new Attribution();

    this.setState((state: any) => { return {attributionList: [...state.attributionList, attribution]} });
  }

  onIncludeCheckbox(e: any, i: number) {
    this.setState((state: any) => { 
      const attributionList = state.attributionList;
      attributionList[i].include = e.target.checked;
      return {attributionList: attributionList};
    });
  }

  onDeleteAttributionButton(i: number) {
    this.setState({
      selectedAttributionIndex: i,
      showDeleteAttributionAlert: true
    });
  }

  deleteSelectedAttribution() {
    this.setState((state: any) => { 
      const attributionList = state.attributionList;
      attributionList.splice(state.selectedAttributionIndex, 1)
      return {
        attributionList: attributionList
      };
    });
  }
}

export default EditAttribution;