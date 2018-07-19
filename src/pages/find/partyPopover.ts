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
import {ViewController,NavParams, NavController} from 'ionic-angular';
import {Party} from "../../model/party";
import { AllMyData } from "../../model/allMyData";
import {Http} from '@angular/http';
import {Utility} from "../../model/utility";
import { InviteFriendsPage } from './inviteFriends';
import { InvitedFriendsPage } from './invitedFriends';
import { LocationTracker } from '../../providers/location-tracker';

@Component({
  selector: 'page-partyPopover',
  templateUrl: 'partyPopover.html'
})

export class PartyPopover {
  private tabName: string = "Find Tab";
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

  ionViewWillEnter(){
    this.synchronizeLatestPartyData();
  }

  close() {
    this.viewCtrl.dismiss();
  }

  private userIsWithinVicinityDistanceOfThisParty(party : Party){
    let distance = Utility.getDistanceInMetersBetweenCoordinates(party.latitude, party.longitude, this.locationTracker.lat, this.locationTracker.lng);
    if(distance < this.locationTracker.vicinityDistance){
      return true;
    }
    return false;
  }

  private partyIsCurrentlyInProgress(party : Party){
    let partyStartTime = new Date(party.startTime).getTime();
    let partyEndTime = new Date(party.endTime).getTime();
    let rightNow = new Date().getTime();
    if((partyStartTime <= rightNow) && (rightNow <= partyEndTime)){
      return true;
    }
    return false;
  }

  synchronizeLatestPartyData(){
    let indexOfParty = Utility.findIndexOfParty(this.party, this.allMyData.invitedTo);
    if(indexOfParty == -1){
        return;
    }
    this.party = this.allMyData.invitedTo[indexOfParty];
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

  changeAttendanceStatus(status : string){
    this.synchronizeLatestPartyData();
    this.allMyData.changeAttendanceStatusToParty(this.party, status, this.http)
    .then((res) => {
        
    })
    .catch((err) => {
      this.allMyData.logError(this.tabName, "server", "changeAttendanceStatusToParty query error : Err msg = " + err, this.http);
    });
  }

  inviteFriendsButtonClicked(){
    this.viewCtrl.dismiss();
    this.navCtrl.push(InviteFriendsPage, {party:this.party}, {animate: false});
  }

  friendsButtonClicked(){
    this.viewCtrl.dismiss();
    this.navCtrl.push(InvitedFriendsPage, {party:this.party}, {animate: false});
  }
}