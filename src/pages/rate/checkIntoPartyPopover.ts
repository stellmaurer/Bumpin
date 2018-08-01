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

import { NavController, ViewController, NavParams } from 'ionic-angular';
import {Party} from "../../model/party";
import { AllMyData } from "../../model/allMyData";
import {Utility} from "../../model/utility";
import { Events } from 'ionic-angular';
import { LocationTracker } from '../../providers/location-tracker';


@Component({
  selector: 'page-checkIntoPartyPopover',
  templateUrl: 'checkIntoPartyPopover.html',
})
export class CheckIntoPartyPopoverPage {
  private tabName: string = "Check-in Tab";
  public party : Party;
  private allMyData : AllMyData;
  private http : Http;
  private params : NavParams;
  private navCtrl : NavController;
  private locationTracker : LocationTracker;

  static get parameters() {
    return [[ViewController],[NavParams]];
  }

  constructor(public viewCtrl: ViewController, params : NavParams) {
    this.params = params;
    this.allMyData = params.get("allMyData");
    this.locationTracker = params.get("locationTracker");
    this.http = params.get("http");
    this.party = params.get("party");
    this.navCtrl = params.get("navCtrl");
  }

  close() {
    this.viewCtrl.dismiss();
  }

  ionViewWillEnter(){
      this.updateTheUI();
      this.allMyData.events.subscribe("timeToUpdateUI",() => {
        this.updateTheUI();
      });
  }

  updateTheUI(){
    this.synchronizeLatestPartyData();
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

  rateParty(rating : string){
    this.synchronizeLatestPartyData();
    this.allMyData.rateParty(this.party, rating, this.http)
    .then((res) => {
        
    })
    .catch((err) => {
        this.allMyData.logError(this.tabName, "server", "rateParty query error : Err msg = " + err, this.http);
    });
    this.locationTracker.checkIn(this.party);
  }
}
