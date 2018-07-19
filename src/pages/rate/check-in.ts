/*******************************************************
 * Copyright (C) 2018 Stephen Ellmaurer <stellmaurer@gmail.com>
 * 
 * This file is part of the Bumpin mobile app project.
 * 
 * The Bumpin project and any of the files within the Bumpin
 * project can not be copied and/or distributed without
 * the express permission of Stephen Ellmaurer.
 *******************************************************/

import { Component, NgZone, ChangeDetectorRef } from '@angular/core';
import {Http} from '@angular/http';

import { NavController } from 'ionic-angular';
import {Party} from "../../model/party";
import {Bar} from "../../model/bar";
import {RatePage} from "./rate";
import { AllMyData } from "../../model/allMyData";
import {Utility} from "../../model/utility";
import { Events } from 'ionic-angular';
import { LocationTracker } from '../../providers/location-tracker';


@Component({
  selector: 'page-check-in',
  templateUrl: 'check-in.html',
})
export class CheckInPage {
  private tabName: string = "Check-in Tab";
  public partiesAndBarsWithinMyVicinity : any[];
  constructor(private allMyData : AllMyData, private ref: ChangeDetectorRef, public zone: NgZone, public locationTracker: LocationTracker, private events : Events, private http:Http, public navCtrl: NavController) {
    this.partiesAndBarsWithinMyVicinity = new Array<any>();
  }

  ionViewDidEnter(){
    this.locationTracker.findPartiesOrBarsInMyVicinity(this.locationTracker.lat, this.locationTracker.lng);
    this.copyMapOfPartiesAndBarsThatAreInMyVicinityOverToASortedArray();
  }

  private goToRatePage(){
    this.navCtrl.push(RatePage, {}, {animate: false});
  }

  private copyMapOfPartiesAndBarsThatAreInMyVicinityOverToASortedArray(){
    this.partiesAndBarsWithinMyVicinity = new Array<any>();
    this.locationTracker.partiesAndBarsThatAreInMyVicinity.forEach((value: any, key: string) => {
        this.partiesAndBarsWithinMyVicinity.push(value);
    });
    let tempThis = this;
    this.partiesAndBarsWithinMyVicinity.sort(function(a, b){
        if(tempThis.getNameOfPartyOrBar(b) < tempThis.getNameOfPartyOrBar(a)){
            return 1;
        }
        if(tempThis.getNameOfPartyOrBar(b) > tempThis.getNameOfPartyOrBar(a)){
            return -1;
        }
        return 0;
    });
  }

  private getNameOfPartyOrBar(partyOrBar : any){
    if(partyOrBar == null){
        return null;
    }
    if(partyOrBar instanceof Party){
        return partyOrBar.title;
    }
    if(partyOrBar instanceof Bar){
        return partyOrBar.name;
    }
  }

  private getIDOfPartyOrBar(partyOrBar : any){
    if(partyOrBar == null){
        return null;
    }
    if(partyOrBar instanceof Party){
        return partyOrBar.partyID;
    }
    if(partyOrBar instanceof Bar){
        return partyOrBar.barID;
    }
  }

  checkIn(partyOrBar : any){
    this.locationTracker.checkIn(partyOrBar);
  }
}
