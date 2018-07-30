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
import { NavController, AlertController, Events} from 'ionic-angular';
import { AllMyData} from '../../model/allMyData';
import { Party } from '../../model/party';
import { Bar, Host } from '../../model/bar';
import { EditPartyPage } from './editParty';
import { EditBarPage } from './editBar';
import { Http } from '@angular/http';
import { CreatePartyPage } from './createParty';
import { CreateBarPage } from './createBar';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'page-host',
  templateUrl: 'host.html'
})
export class HostPage {

  private tabName: string = "Host Tab";
  private partyToCreate : Party;
  private barToCreate : Bar;
  private currentlyLoadingData : boolean;
  private numberOfTutorialStepsCompleted : number;
  private overlayIsActive : boolean;
  private upperLeftButtonExplanationIsActive : boolean;
  private upperRightButtonExplanationIsActive : boolean;
  private listExplanationIsActive : boolean;

  constructor(private storage: Storage, public allMyData : AllMyData, private events:Events, private http:Http, private navCtrl: NavController, public alertCtrl: AlertController) {
    this.currentlyLoadingData = true;
    this.partyToCreate = new Party();
    this.barToCreate = new Bar();
    this.setMeAsTheMainHostForTheParty();
    this.setMeAsTheMainHostForTheBar();
    this.partyToCreate.setDefaultStartAndEndTimesForParty();
    this.initializePartyAndBarDataFromLocalDataStorage();

    this.overlayIsActive = false;
    this.upperLeftButtonExplanationIsActive = false;
    this.upperRightButtonExplanationIsActive = false;
    this.listExplanationIsActive = false;
    this.numberOfTutorialStepsCompleted = 3;
    this.storage.get("numberOfTutorialStepsCompletedHostTab")
    .then((val : number) => {
        if((val == null)){
            this.numberOfTutorialStepsCompleted = 0;
            this.storage.set("numberOfTutorialStepsCompletedHostTab", 0);
            this.overlayIsNowActive();
        }else {
            this.numberOfTutorialStepsCompleted = val;
            if(this.numberOfTutorialStepsCompleted != 3){
                this.overlayIsNowActive();
            }
        }
    });
  }

  ionViewDidLoad(){
    this.events.subscribe("userHasJustCreatedABar",() => {
      this.barToCreate = new Bar();
      this.setMeAsTheMainHostForTheBar();
    });
    this.events.subscribe("userHasJustCreatedAParty",() => {
      this.partyToCreate = new Party();
      this.setMeAsTheMainHostForTheParty();
      this.partyToCreate.setDefaultStartAndEndTimesForParty();
    });
  }

  ionViewWillEnter(){
    if(this.numberOfTutorialStepsCompleted != 3){
      this.overlayIsNowActive();
    }
    this.allMyData.refreshDataAndResetPeriodicDataRetrievalTimer(this.http);
  }

  ionViewDidEnter(){
    this.currentlyLoadingData = true;

    this.allMyData.refreshPerson(this.http)
    .then((res) => {

      Promise.all([this.allMyData.refreshPartiesImHosting(this.http),
                   this.allMyData.refreshBarsImHosting(this.http)])
        .then(thePromise => {
          this.currentlyLoadingData = false;
        })
        .catch((err) => {
          this.currentlyLoadingData = false;
          this.allMyData.logError(this.tabName, "server", "refreshPartiesImHosting or refreshBarsImHosting query error: Err msg = " + err, this.http);
        });

    })
    .catch((err) => {
      this.allMyData.logError(this.tabName, "server", "refreshPerson query error: Err msg = " + err, this.http);
      this.currentlyLoadingData = false;
    });
  }

  ionViewWillLeave(){
    this.overlayIsNowInactive();
  }

  private initializePartyAndBarDataFromLocalDataStorage(){
    Promise.all([this.allMyData.initializeBarsImHostingFromLocalDataStorage(this.tabName, this.http),
                 this.allMyData.initializePartiesImHostingFromLocalDataStorage(this.tabName, this.http)])
    .then(thePromise => {
      
    });
  }

  private setMeAsTheMainHostForTheParty(){
    var mainHost : Host = new Host();
    mainHost.isMainHost = true;
    mainHost.name = this.allMyData.me.name;
    mainHost.status = "Accepted";
    this.partyToCreate.hosts.set(this.allMyData.me.facebookID, mainHost);
  }

  private setMeAsTheMainHostForTheBar(){
    var mainHost : Host = new Host();
    mainHost.isMainHost = true;
    mainHost.name = this.allMyData.me.name;
    mainHost.status = "Accepted";
    this.barToCreate.hosts.set(this.allMyData.me.facebookID, mainHost);
  }

  goToCreatePartyPage(){
    this.navCtrl.push(CreatePartyPage, {party:this.partyToCreate}, {animate: false});
  }

  goToCreateBarPage(){
    this.navCtrl.push(CreateBarPage, {bar:this.barToCreate}, {animate: false});
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
      this.upperLeftButtonExplanationIsActive = true;
    }
    if(this.numberOfTutorialStepsCompleted == 2){
      this.upperRightButtonExplanationIsActive = true;
    }
  }

  overlayWasClicked(){
    this.numberOfTutorialStepsCompleted++;
    this.storage.set("numberOfTutorialStepsCompletedHostTab", this.numberOfTutorialStepsCompleted);

    this.upperLeftButtonExplanationIsActive = false;
    this.upperRightButtonExplanationIsActive = false;
    this.listExplanationIsActive = false;

    if(this.numberOfTutorialStepsCompleted == 1){
      this.upperLeftButtonExplanationIsActive = true;
    }
    if(this.numberOfTutorialStepsCompleted == 2){
      this.upperRightButtonExplanationIsActive = true;
    }
    if(this.numberOfTutorialStepsCompleted == 3){
      this.overlayIsNowInactive();
    }
  }
}
