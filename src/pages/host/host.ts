import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Person } from '../../model/person';
import { AllMyData} from '../../model/allMyData';
import { Party } from '../../model/party';
import { Bar } from '../../model/bar';
import { CreatePage } from './create';


@Component({
  selector: 'page-host',
  templateUrl: 'host.html'
})
export class HostPage {

  constructor(public allMyData : AllMyData, private navCtrl: NavController) {
    console.log(allMyData.me.name);
    
  }

  partySelected(party : Party) {
    
  }

  barSelected(bar : Bar) {
    
  }

  goToCreatePage(){
    this.navCtrl.push(CreatePage, {}, {animate: false});
  }
}
