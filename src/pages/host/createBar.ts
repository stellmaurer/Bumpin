import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Person } from '../../model/person';
import { AllMyData} from '../../model/allMyData';
import { Party } from '../../model/party';
import { Bar } from '../../model/bar';


@Component({
  selector: 'page-createBar',
  templateUrl: 'createBar.html'
})
export class CreateBarPage {

  constructor(public allMyData : AllMyData, private navCtrl: NavController) {
    console.log("In createBar.ts");
    
  }
}
