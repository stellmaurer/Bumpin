import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Person } from '../../model/person';
import { AllMyData} from '../../model/allMyData';
import { Party } from '../../model/party';
import { Bar } from '../../model/bar';
import { CreatePartyPage } from './createParty';
import { CreateBarPage } from './createBar';


@Component({
  selector: 'page-create',
  templateUrl: 'create.html'
})
export class CreatePage {

  constructor(public allMyData : AllMyData, private navCtrl: NavController) {
    console.log("In create.ts");
    
  }

  goToCreatePartyPage(){
    this.navCtrl.push(CreatePartyPage, {}, {animate: false});
  }

  goToCreateBarPage(){
    this.navCtrl.push(CreateBarPage, {}, {animate: false});
  }
}
