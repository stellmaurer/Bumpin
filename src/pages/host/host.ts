/*******************************************************
 * Copyright (C) 2018 Stephen Ellmaurer <stellmaurer@gmail.com>
 * 
 * This file is part of the Bumpin mobile app project.
 * 
 * The Bumpin project and any of the files within the Bumpin
 * project can not be copied and/or distributed without
 * the express permission of Stephen Ellmaurer.
 *******************************************************/

import { Component } from '@angular/core';
import { NavController, AlertController} from 'ionic-angular';
import { AllMyData} from '../../model/allMyData';
import { Party } from '../../model/party';
import { Bar } from '../../model/bar';
import { CreatePage } from './create';
import { EditPartyPage } from './editParty';
import { EditBarPage } from './editBar';
import { Http } from '@angular/http';
import { Badge } from '@ionic-native/badge';

@Component({
  selector: 'page-host',
  templateUrl: 'host.html'
})
export class HostPage {

  private tabName: string = "Host Tab";

  constructor(private badge: Badge, public allMyData : AllMyData, private http:Http, private navCtrl: NavController, public alertCtrl: AlertController) {
    
  }

  ionViewDidLoad(){
    
  }

  ionViewDidEnter(){
    //this.badge.set(10);
    this.badge.hasPermission()
    .then((res) => {
      console.log("this.badge.hasPermission = " + res);
      this.allMyData.logError(this.tabName, "client", "this.badge.hasPermission = " + res, this.http);
    })
    .catch((err) => {
      console.log("this.badge.hasPermission = error");
      this.allMyData.logError(this.tabName, "client", "this.badge.hasPermission = " + err, this.http);
    });

    this.allMyData.refreshPerson(this.http)
    .then((res) => {

      this.allMyData.refreshPartiesImHosting(this.http)
      .then((res) => {
      })
      .catch((err) => {
        this.allMyData.logError(this.tabName, "server", "refreshPartiesImHosting query error: Err msg = " + err, this.http);
      });

      this.allMyData.refreshBarsImHosting(this.http)
      .then((res) => {
      })
      .catch((err) => {
        this.allMyData.logError(this.tabName, "server", "refreshBarsImHosting query error: Err msg = " + err, this.http);
      });

    })
    .catch((err) => {
      this.allMyData.logError(this.tabName, "server", "refreshPerson query error: Err msg = " + err, this.http);
    });
  }

  partySelected(party : Party) {
    if(party.hosts.get(this.allMyData.me.facebookID).status == "Waiting"){
      this.acceptOrDeclineHostingAPartyAlert(party);
    }else{
      this.navCtrl.push(EditPartyPage, {party: party}, {animate: false});
    }
  }

  barSelected(bar : Bar) {
    if(bar.hosts.get(this.allMyData.me.facebookID).status == "Waiting"){
      this.acceptOrDeclineHostingABarAlert(bar);
    }else{
      this.navCtrl.push(EditBarPage, {bar: bar}, {animate: false});
    }
  }

  goToCreatePage(){
    this.navCtrl.push(CreatePage, {}, {animate: false});
  }

  private acceptOrDeclineHostingAPartyAlert(party : Party) {
    let nameOfMainHost = "";
    for(let i = 0; i < party.keysInHostsMap.length; i++){
      if(party.hosts.get(party.keysInHostsMap[i]).isMainHost){
        nameOfMainHost = party.hosts.get(party.keysInHostsMap[i]).name;
      }
    }
    let alert = this.alertCtrl.create({
      title: nameOfMainHost + ' asked you to host this party with them. What would you like to do?'
    });
    alert.addButton({
        text: 'Decline',
        handler: data => {
          this.allMyData.declineInvitationToHostParty(party, this.http)
          .then((res) => {
            this.locallyRemovePartyFromPartiesImHosting(party);
          })
          .catch((err) => {
            this.allMyData.logError(this.tabName, "server", "declineInvitationToHostParty query error: Err msg = " + err, this.http);
          });
        }
    });
    alert.addButton({
        text: 'Accept',
        handler: data => {
            this.allMyData.acceptInvitationToHostParty(party, this.http)
            .then((res) => {
              party.hosts.get(this.allMyData.me.facebookID).status = "Accepted";
              this.navCtrl.push(EditPartyPage, {party: party}, {animate: false});
            })
            .catch((err) => {
              this.allMyData.logError(this.tabName, "server", "acceptInvitationToHostParty query error: Err msg = " + err, this.http);
            });
        }
    });
    alert.present();
  }

  private acceptOrDeclineHostingABarAlert(bar : Bar) {
    let nameOfMainHost = "";
    for(let i = 0; i < bar.keysInHostsMap.length; i++){
      if(bar.hosts.get(bar.keysInHostsMap[i]).isMainHost){
        nameOfMainHost = bar.hosts.get(bar.keysInHostsMap[i]).name;
      }
    }
    let alert = this.alertCtrl.create({
      title: nameOfMainHost + ' asked you to host this bar with them. What would you like to do?'
    });
    alert.addButton({
        text: 'Decline',
        handler: data => {
          this.allMyData.declineInvitationToHostBar(bar, this.http)
          .then((res) => {
            this.locallyRemoveBarFromBarsImHosting(bar);
          })
          .catch((err) => {
            this.allMyData.logError(this.tabName, "server", "declineInvitationToHostBar query error: Err msg = " + err, this.http);
          });
        }
    });
    alert.addButton({
        text: 'Accept',
        handler: data => {
            this.allMyData.acceptInvitationToHostBar(bar, this.http)
            .then((res) => {
              bar.hosts.get(this.allMyData.me.facebookID).status = "Accepted";
              this.navCtrl.push(EditBarPage, {bar: bar}, {animate: false});
            })
            .catch((err) => {
              this.allMyData.logError(this.tabName, "server", "acceptInvitationToHostBar query error: Err msg = " + err, this.http);
            });
        }
    });
    alert.present();
  }

  private locallyRemovePartyFromPartiesImHosting(party : Party){
    let newPartyHostForArray : Party[] = new Array<Party>();
    for(let i = 0; i < this.allMyData.partyHostFor.length; i++){
      if(this.allMyData.partyHostFor[i].partyID != party.partyID){
        newPartyHostForArray.push(this.allMyData.partyHostFor[i]);
      }
    }
    this.allMyData.partyHostFor = newPartyHostForArray;
  }

  private locallyRemoveBarFromBarsImHosting(bar : Bar){
    let newBarHostForArray : Bar[] = new Array<Bar>();
    for(let i = 0; i < this.allMyData.barHostFor.length; i++){
      if(this.allMyData.barHostFor[i].barID != bar.barID){
        newBarHostForArray.push(this.allMyData.barHostFor[i]);
      }
    }
    this.allMyData.barHostFor = newBarHostForArray;
  }
}
