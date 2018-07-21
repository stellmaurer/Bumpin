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
import {Bar} from "../../model/bar";
import { AllMyData } from "../../model/allMyData";
import {Utility} from "../../model/utility";
import { Events } from 'ionic-angular';
import { LocationTracker } from '../../providers/location-tracker';


@Component({
  selector: 'page-checkIntoBarPopover',
  templateUrl: 'checkIntoBarPopover.html',
})
export class CheckIntoBarPopoverPage {
    private tabName: string = "Check-in Tab";
    public bar : Bar;
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
        this.bar = params.get("bar");
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
        this.synchronizeLatestBarData();
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

    rateBar(rating : string){
        this.synchronizeLatestBarData();
        this.allMyData.rateBar(this.bar, rating, this.http)
        .then((res) => {
            
        })
        .catch((err) => {
            this.allMyData.logError(this.tabName, "server", "rateBar query error : Err msg = " + err, this.http);
        });
    }
}
