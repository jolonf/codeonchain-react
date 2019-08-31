
import { Attribution } from './attribution';

export class AttributionStorage {

  static getAttributions(): Attribution[] | undefined {
    if (window.localStorage) {
      let attributionsJson = window.localStorage.attributions;

      if (attributionsJson) {
        const attributions = JSON.parse(attributionsJson);
        return attributions;
      }
    }
  }

  static storeAttributions(attributions: Attribution[]) {
    // Retrieve
    if (window.localStorage) {
      window.localStorage.attributions = JSON.stringify(attributions, null, 2);
    } else {
      console.log('No local storage to store attributions!');
    }
  }
}
