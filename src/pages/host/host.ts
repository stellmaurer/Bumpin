import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Person } from '../../model/person';
import { AllMyData} from '../../model/allMyData';
import { Party } from '../../model/party';
import { Bar } from '../../model/bar';
import { CreatePage } from './create';
import {Http} from '@angular/http';

@Component({
  selector: 'page-host',
  templateUrl: 'host.html'
})
export class HostPage {

  constructor(public allMyData : AllMyData, private http:Http, private navCtrl: NavController) {
    console.log(allMyData.me.name);
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
    })
    .catch((err) => {
      console.log(err);
    });
  }

  partySelected(party : Party) {
    
  }

  barSelected(bar : Bar) {
    
  }

  goToCreatePage(){
    this.navCtrl.push(CreatePage, {}, {animate: false});
  }
}
