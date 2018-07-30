/*******************************************************
 * Copyright (C) 2018 Stephen Ellmaurer <stellmaurer@gmail.com>
 * 
 * This file is part of the Bumpin mobile app project.
 * 
 * The Bumpin project and any of the files within the Bumpin
 * project can not be copied and/or distributed without
 * the express permission of Stephen Ellmaurer.
 *******************************************************/

import { Component, NgZone } from '@angular/core';
import {Http} from '@angular/http';
import { NavController, PopoverController, Checkbox } from 'ionic-angular';
import {Party} from "../../model/party";
import {Bar} from "../../model/bar";
import { AllMyData } from "../../model/allMyData";
import { Events } from 'ionic-angular';
import { LocationTracker } from '../../providers/location-tracker';
import { CheckIntoPartyPopoverPage } from './checkIntoPartyPopover';
import { CheckIntoBarPopoverPage } from './checkIntoBarPopover';
import { Storage } from '@ionic/storage';


@Component({
  selector: 'page-check-in',
  templateUrl: 'check-in.html',
})
export class CheckInPage {
    private tabName: string = "Check-in Tab";
    public partiesAndBarsWithinMyVicinity : any[];
    public party : Party;
    public bar : Bar;
    public partyOrBarImAt : string;
    private numberOfTutorialStepsCompleted : number;
    private overlayIsActive : boolean;
    private listExplanationIsActive : boolean;
    private popoverExplanationIsActive : boolean;

    constructor(private storage: Storage, public popoverCtrl: PopoverController, private allMyData : AllMyData, public zone: NgZone, public locationTracker: LocationTracker, private events : Events, private http:Http, public navCtrl: NavController) {
        this.partiesAndBarsWithinMyVicinity = new Array<any>();
        this.initializePartyAndBarDataFromLocalDataStorage();
        this.numberOfTutorialStepsCompleted = 0;
        this.overlayIsActive = false;
        this.listExplanationIsActive = false;
        this.popoverExplanationIsActive = false;

        this.numberOfTutorialStepsCompleted = 2;

        this.storage.get("numberOfTutorialStepsCompletedCheckInTab")
        .then((val : number) => {
            if((val == null)){
                this.numberOfTutorialStepsCompleted = 0;
                this.storage.set("numberOfTutorialStepsCompletedCheckInTab", 0);
                this.overlayIsNowActive();
            }else {
                this.numberOfTutorialStepsCompleted = val;
                if(this.numberOfTutorialStepsCompleted != 2){
                    this.overlayIsNowActive();
                }
            }
        });
    }

    ionViewDidLoad(){
        
    }

    ionViewWillEnter(){
        if(this.numberOfTutorialStepsCompleted != 2){
            this.overlayIsNowActive();
        }
    }

    ionViewWillLeave(){
        this.overlayIsNowInactive();
    }

    ionViewDidEnter(){
        this.locationTracker.findPartiesOrBarsInMyVicinity(this.locationTracker.lat, this.locationTracker.lng);
        this.copyMapOfPartiesAndBarsThatAreInMyVicinityOverToASortedArray();
    }

    private initializePartyAndBarDataFromLocalDataStorage(){
        if(this.allMyData.barsCloseToMe.length == 0){
            Promise.all([this.allMyData.initializeBarsCloseToMeFromLocalDataStorage(this.tabName, this.http), 
                this.allMyData.initializeBarsImHostingFromLocalDataStorage(this.tabName, this.http),
                this.allMyData.initializePartiesImInvitedToFromLocalDataStorage(this.tabName, this.http),
                this.allMyData.initializePartiesImHostingFromLocalDataStorage(this.tabName, this.http)])
            .then(thePromise => {
                this.locationTracker.findPartiesOrBarsInMyVicinity(this.locationTracker.lat, this.locationTracker.lng);
                this.copyMapOfPartiesAndBarsThatAreInMyVicinityOverToASortedArray();
            });
        }
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

    ionChangeEvent(event : Checkbox, partyOrBar){
        event.checked = (this.locationTracker.partyOrBarImAt == this.getIDOfPartyOrBar(partyOrBar)) && (this.locationTracker.userIsCheckedIn == true)
    }

    checkIn(event : Checkbox, partyOrBar : any){
        this.locationTracker.checkIn(partyOrBar);
        if(partyOrBar instanceof Party){
            this.presentPartyPopover(partyOrBar);
        }
        if(partyOrBar instanceof Bar){
            this.presentBarPopover(partyOrBar);
        }
    }

    private presentPartyPopover(party : Party) {
        let popover = this.popoverCtrl.create(CheckIntoPartyPopoverPage, {party:party, allMyData:this.allMyData, locationTracker:this.locationTracker, http:this.http, navCtrl:this.navCtrl}, {cssClass:'checkIntoPartyPopover.scss'});
        popover.present();
    }
    
    private presentBarPopover(bar : Bar) {
        let popover = this.popoverCtrl.create(CheckIntoBarPopoverPage, {bar:bar, allMyData:this.allMyData, locationTracker:this.locationTracker, http:this.http}, {cssClass:'checkIntoBarPopover.scss'});
        popover.present();
    }

    overlayIsNowActive(){
        this.overlayIsActive = true;
        this.events.publish("overlayIsNowActive");
        this.determineWhichTutorialStepToShow();
    }

    overlayIsNowInactive(){
        this.overlayIsActive = false;
        this.events.publish("overlayIsNowInactive");
    }

    determineWhichTutorialStepToShow(){
        if(this.numberOfTutorialStepsCompleted == 0){
            this.listExplanationIsActive = true;
        }
        if(this.numberOfTutorialStepsCompleted == 1){
            this.popoverExplanationIsActive = true;
        }
    }
    
    overlayWasClicked(){
        this.numberOfTutorialStepsCompleted++;
        this.storage.set("numberOfTutorialStepsCompletedCheckInTab", this.numberOfTutorialStepsCompleted);

        this.listExplanationIsActive = false;
        this.popoverExplanationIsActive = false;

        if(this.numberOfTutorialStepsCompleted == 1){
            this.popoverExplanationIsActive = true;
        }
        if(this.numberOfTutorialStepsCompleted == 2){
            this.listExplanationIsActive = false;
            this.popoverExplanationIsActive = false;
            this.overlayIsNowInactive();
        }
    }
    
}
