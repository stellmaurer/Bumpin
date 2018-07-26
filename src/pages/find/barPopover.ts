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
import {ViewController,NavParams, AlertController, NavController} from 'ionic-angular';
import {Bar} from "../../model/bar";
import { AllMyData } from "../../model/allMyData";
import {Http} from '@angular/http';
import {Utility} from "../../model/utility";
import { LocationTracker } from '../../providers/location-tracker';
import { ClaimBarPage } from '../find/claimBar';

@Component({
  selector: 'page-barPopover',
  templateUrl: 'barPopover.html'
})

export class BarPopover {
  private tabName: string = "Find Tab";
  public bar : Bar;
  private allMyData : AllMyData;
  private locationTracker : LocationTracker;
  private http : Http;
  private navCtrl : NavController;
  private iAmHostingThisBar : boolean;

  static get parameters() {
    return [[ViewController],[NavParams]];
  }

  constructor(public viewCtrl: ViewController, params : NavParams, public alertCtrl: AlertController) {
    this.allMyData = params.get("allMyData");
    this.locationTracker = params.get("locationTracker");
    this.http = params.get("http");
    this.bar = params.get("bar");
    this.navCtrl = params.get("navCtrl");
    this.iAmHostingThisBar = this.amIHostingThisBar();
  }

  ionViewWillEnter(){
    this.synchronizeLatestBarData();
  }

  close() {
    this.viewCtrl.dismiss();
  }

  goToClaimBarPage(){
    this.viewCtrl.dismiss();
    this.navCtrl.push(ClaimBarPage, {bar:this.bar}, {animate: false});
  }

  private amIHostingThisBar(){
    for(let i = 0; i < this.allMyData.barHostFor.length; i++){
      if(this.bar.barID == this.allMyData.barHostFor[i].barID){
        return true;
      }
    }
    return false;
  }

  private userIsWithinVicinityDistanceOfThisBar(bar : Bar){
    let distance = Utility.getDistanceInMetersBetweenCoordinates(bar.latitude, bar.longitude, this.locationTracker.lat, this.locationTracker.lng);
    if(distance < this.locationTracker.vicinityDistance){
      return true;
    }
    return false;
  }

  synchronizeLatestBarData(){
   let indexOfBar = Utility.findIndexOfBar(this.bar, this.allMyData.barsCloseToMe);
    if(indexOfBar == -1){
      return;
    }
    this.bar = this.allMyData.barsCloseToMe[indexOfBar];
  }

  rateBar(rating : string){
    this.synchronizeLatestBarData();
    this.allMyData.rateBar(this.bar, rating, this.http)
    .then((res) => {
    
    })
    .catch((err) => {
      this.allMyData.logError(this.tabName, "server", "rateBar query error : Err msg = " + err, this.http);
    });
    this.locationTracker.checkIn(this.bar);
  }


  changeAttendanceStatus(status : string){
    this.synchronizeLatestBarData();
    this.allMyData.changeAttendanceStatusToBar(this.bar, status, this.http)
    .then((res) => {
      
    })
    .catch((err) => {
      this.allMyData.logError(this.tabName, "server", "changeAttendanceStatusToBar query error : Err msg = " + err, this.http);
    });
  }
}