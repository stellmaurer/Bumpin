import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Person } from '../../model/person';
import { AllMyData} from '../../model/allMyData';
import { Party } from '../../model/party';
import { Bar } from '../../model/bar';
import { CreatePage } from './create';
import { EditPartyPage } from './editParty';
import { EditBarPage } from './editBar';
import { Http } from '@angular/http';

@Component({
  selector: 'page-host',
  templateUrl: 'host.html'
})
export class HostPage {

  constructor(public allMyData : AllMyData, private http:Http, private navCtrl: NavController) {
  }

  ionViewDidLoad(){
    
  }

  ionViewDidEnter(){
    this.allMyData.refreshPerson(this.http)
    .then((res) => {

      this.allMyData.refreshPartiesImHosting(this.http)
      .then((res) => {
      })
      .catch((err) => {
        console.log(err);
      });

      this.allMyData.refreshBarsImHosting(this.http)
      .then((res) => {
      })
      .catch((err) => {
        console.log(err);
      });

    })
    .catch((err) => {
      console.log(err);
    });
  }

  partySelected(party : Party) {
    console.log(party.title + " selected");
    this.navCtrl.push(EditPartyPage, {party: party}, {animate: false});
  }

  barSelected(bar : Bar) {
    console.log(bar.name + " selected");
    this.navCtrl.push(EditBarPage, {bar: bar}, {animate: false});
  }

  goToCreatePage(){
    this.navCtrl.push(CreatePage, {}, {animate: false});
  }
}
