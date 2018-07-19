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
import {Http} from '@angular/http';

import { NavController } from 'ionic-angular';
import {Party} from "../../model/party";
import {Bar} from "../../model/bar";
import { AllMyData } from "../../model/allMyData";
import {Utility} from "../../model/utility";
import { Events } from 'ionic-angular';
import { LocationTracker } from '../../providers/location-tracker';


@Component({
  selector: 'page-rate',
  templateUrl: 'rate.html',
})
export class RatePage {
  private tabName: string = "Check-in Tab";
  public party : Party;
  public bar : Bar;
  constructor(private allMyData : AllMyData, private locationTracker: LocationTracker, private events : Events, private http:Http, public navCtrl: NavController) {}

  ionViewWillEnter(){
      this.updateTheUI();
      this.events.subscribe("timeToUpdateUI",() => {
        this.updateTheUI();
      });
  }

  updateTheUI(){
    this.party = this.locationTracker.partyUserIsCheckedInto;
    this.bar = this.locationTracker.barUserIsCheckedInto;
    this.synchronizeLatestPartyData();
    this.synchronizeLatestBarData();
  }


 synchronizeLatestPartyData(){
   if(this.party != null){
    let indexOfParty = Utility.findIndexOfParty(this.party, this.allMyData.invitedTo);
    if(indexOfParty == -1){
      return;
    }
    this.party = this.allMyData.invitedTo[indexOfParty];
   }
 }

 synchronizeLatestBarData(){
   if(this.bar != null){
    let indexOfBar = Utility.findIndexOfBar(this.bar, this.allMyData.barsCloseToMe);
    if(indexOfBar == -1){
      return;
    }
    this.bar = this.allMyData.barsCloseToMe[indexOfBar];
   }
 }

  rateParty(rating : string){
    this.synchronizeLatestPartyData();
    this.allMyData.rateParty(this.party, rating, this.http)
    .then((res) => {
        
    })
    .catch((err) => {
        this.allMyData.logError(this.tabName, "server", "rateParty query error : Err msg = " + err, this.http);
    });
  }

  rateBar(rating : string){
    this.synchronizeLatestBarData();
    this.allMyData.rateBar(this.bar, rating, this.http)
        .then((res) => {
          
        })
        .catch((err) => {
          this.allMyData.logError(this.tabName, "server", "rateBar query error : Err msg = " + err, this.http);
        });
  }

  checkIn(){
    this.locationTracker.userLastCheckedInAt = new Date();
    this.locationTracker.userIsCheckedIn = true;
    this.locationTracker.partyUserIsCheckedInto = null;
    this.locationTracker.barUserIsCheckedInto = this.bar;
    this.locationTracker.partyOrBarImAt = this.bar.barID;
    this.allMyData.storage.set("userLastCheckedInAt", new Date());
    this.allMyData.storage.set("userIsCheckedIn", true);
    this.allMyData.storage.set("partyUserIsCheckedInto", null);
    this.allMyData.storage.set("barUserIsCheckedInto", this.bar.barID);
    this.allMyData.storage.set("partyOrBarImAt", this.bar.barID);
    //this.locationTracker.updateWhereIAmAt();
  }
}
