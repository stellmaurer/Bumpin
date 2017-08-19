import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Person } from '../../model/person';
import { AllMyData} from '../../model/allMyData';

@Component({
  selector: 'page-host',
  templateUrl: 'host.html'
})
export class HostPage {

  constructor(private allMyData : AllMyData, public navCtrl: NavController) {
    console.log(allMyData.me.name);
  }

}
