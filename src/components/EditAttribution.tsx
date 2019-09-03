import './EditAttribution.css';

import React from "react";
import { IonCard, IonButton, IonInput, IonCardContent, IonCardHeader, IonCardTitle, IonCheckbox, IonLabel, IonAlert } from "@ionic/react";
import { Attribution } from '../storage/attribution';
import { AttributionStorage } from '../storage/attribution-storage';

interface EditAttributionProps {
  onClose(): void;
  onAttributions(a: Attribution[]): void;
}

class EditAttribution extends React.Component<EditAttributionProps> {

  state = {
    attributionList: [] as Attribution[],
    currency: 'BSV',
    selectedAttributionIndex: -1,
    showDeleteAttributionAlert: false,
    saveLocalStorage: true
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
              <IonInput placeholder='Name' value={attribution.name} onIonChange={(e: any) => this.setAttributionProperty(i, 'name', e.target.value)}></IonInput>
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent className='attribution-content'>
            <IonInput placeholder='Contact (Web address, email, etc)' value={attribution.contact} onIonChange={(e: any) => this.setAttributionProperty(i, 'contact', e.target.value)}/>
            <IonInput placeholder='Role' value={attribution.role} onIonChange={(e: any) => this.setAttributionProperty(i, 'role', e.target.value)}/>
            <IonInput placeholder='License' value={attribution.license} onIonChange={(e: any) => this.setAttributionProperty(i, 'license', e.target.value)}/>
            <IonInput placeholder='Paymail or BSV address' value={attribution.sponsor} onIonChange={(e: any) => this.setAttributionProperty(i, 'sponsor', e.target.value)}/>
            <IonInput placeholder='Amount' value={attribution.defaultAmount} type='number' onIonChange={(e: any) => this.setAttributionProperty(i, 'defaultAmount', e.target.value)}/>
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
        <div className='center'>
          Currency: <select value={this.state.currency} onChange={(e) => this.onCurrencyChanged(e)}>
            <option value='BSV'>BSV</option>
            <option value='USD'>USD</option>
            <option disabled>──────────</option>
            <option value='AUD'>AUD</option>
            <option value='CAD'>CAD</option>
            <option value='CHF'>CHF</option>
            <option value='CYN'>CYN</option>
            <option value='EUR'>EUR</option>
            <option value='GBP'>GBP</option>
            <option value='HKD'>HKD</option>
            <option value='JPY'>JPY</option>
            <option value='KRW'>KRW</option>
            <option value='NZD'>NZD</option>
            <option value='RUB'>RUB</option>
            <option value='SEK'>SEK</option>
            <option value='SGD'>SGD</option>
            <option value='THB'>THB</option>
            <option value='ZAR'>ZAR</option>
          </select>
        </div>
        <div>
          <IonCheckbox id='save-checkbox' checked={this.state.saveLocalStorage} onIonChange={e => this.onSaveLocalStorageChanged(e)} /> <IonLabel>Save in local storage</IonLabel>
        </div>
        <div className='center'>
          <IonButton onClick={() => this.props.onClose()}>Cancel</IonButton>
          <IonButton onClick={() => this.onSave()} color='success'>Save</IonButton>
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

  componentDidMount() {
    const storedAttributions = AttributionStorage.getAttributions();
    if (storedAttributions) {
      const attributions = this.state.attributionList;
      let currency = 'BSV';
      // Merge
      for (const attribution of storedAttributions) {
        let foundIndex = -1;
        const existing = attributions.find((a, i) => {
          if (a.name === attribution.name) {
            foundIndex = i;
            return true;
          }
          return false;
        });
        if (existing) {
          attributions[foundIndex] = attribution;
        } else {
          attributions.push(attribution);
        }
        currency = attribution.currency;
      }
      this.setState({attributionList: attributions, currency: currency});
    }
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

  onCurrencyChanged(e: React.ChangeEvent<HTMLSelectElement>) {
    if (e.target) {
      this.setState({currency: e.target.value});
    }
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

  setAttributionProperty(index: number, property: string, value: string) {
    this.setState((state: any) => {
      state.attributionList[index][property] = value;
      return state;
    });
  }

  onSaveLocalStorageChanged(e: any) {
    this.setState({saveLocalStorage: e.target.checked});
  }

  onSave() {
    // Set currency
    const attributions = this.state.attributionList;
    attributions.forEach(a => a.currency = this.state.currency);
    if (this.state.saveLocalStorage) {
      AttributionStorage.storeAttributions(attributions);
    }
    this.props.onAttributions(attributions.filter(a => a.include));
  }
}

export default EditAttribution;