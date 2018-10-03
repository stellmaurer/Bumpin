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
import { App, NavController, AlertController, Events } from 'ionic-angular';
import { AllMyData } from '../../model/allMyData';
import { Http } from '@angular/http';
import { FriendsPage } from './friends';
import { MyStatusPage } from './myStatus';
import { NotificationsPage } from './notifications';
import { AppVersion } from '@ionic-native/app-version';
import { Storage } from '@ionic/storage';
import { PointsPage } from './points';

@Component({
  selector: 'page-more',
  templateUrl: 'more.html'
})
export class MorePage {

  private tabName: string = "More Tab";
  private bugDescription: string;
  private featureRequest: string;
  private currentlyLoadingData: boolean;
  private versionNumber : string;
  private numberOfTutorialStepsCompleted : number;
  private overlayIsActive : boolean;
  private notificationsButtonExplanationIsActive : boolean;
  private friendsButtonExplanationIsActive : boolean;
  private feedbackExplanationIsActive : boolean;
  private logoutExplanationIsActive : boolean;

  constructor(private storage: Storage, private events: Events, private appVersion: AppVersion, private app: App, public allMyData : AllMyData, private http:Http, private navCtrl: NavController, public alertCtrl: AlertController) {
    this.currentlyLoadingData = true;
    this.bugDescription = "";
    this.featureRequest = "";
    this.versionNumber = "X.X.X";
    this.appVersion.getVersionNumber()
    .then((versionNumber : string) => {
      this.versionNumber = versionNumber;
    });
    this.overlayIsActive = false;
    this.notificationsButtonExplanationIsActive = false;
    this.friendsButtonExplanationIsActive = false;
    this.feedbackExplanationIsActive = false;
    this.logoutExplanationIsActive = false;
    this.numberOfTutorialStepsCompleted = 4;
    this.storage.get("numberOfTutorialStepsCompletedMoreTab")
    .then((val : number) => {
        if((val == null)){
            this.numberOfTutorialStepsCompleted = 0;
            this.storage.set("numberOfTutorialStepsCompletedMoreTab", 0);
            this.overlayIsNowActive();
        }else {
            this.numberOfTutorialStepsCompleted = val;
            if(this.numberOfTutorialStepsCompleted != 4){
                this.overlayIsNowActive();
            }
        }
    });
  }

  ionViewDidEnter(){
    this.currentlyLoadingData = true;

    Promise.all([this.allMyData.getNotifications(this.http),
                 this.allMyData.refreshFriends(this.http)])
      .then(thePromise => {
        this.currentlyLoadingData = false;
      })
      .catch((err) => {
        this.currentlyLoadingData = false;
        this.allMyData.logError(this.tabName, "server", "refreshFriends or getNotifications query error: Err msg = " + err, this.http);
      });
      
  }

  ionViewWillEnter(){
    if(this.numberOfTutorialStepsCompleted != 4){
      this.overlayIsNowActive();
    }
    
    this.allMyData.storage.get('goingOutStatusNotification')
    .then((message : any) => {
      if(message != null){
        this.allMyData.storage.remove('goingOutStatusNotification');
        this.goToFriendStatusPage();
      }
    });
  }

  ionViewWillLeave(){
    this.overlayIsNowInactive();
  }

  private goToPointsPage(){
    this.navCtrl.push(PointsPage, {}, {animate: false});
  }

  private goToNotificationsPage(){
    this.navCtrl.push(NotificationsPage, {}, {animate: false});
  }

  private goToFriendStatusPage(){
    this.navCtrl.push(FriendsPage, {}, {animate: false});
  }

  private goToMyStatusPage(){
    this.navCtrl.push(MyStatusPage, {}, {animate: false});
  }

  private submitBug(){
    if(this.bugDescription != ""){
      this.createBug();
    }
  }

  private submitFeatureRequest(){
    if(this.featureRequest != ""){
      this.createFeatureRequest();
    }
  }

  private createBug(){
    this.allMyData.createBug(this.bugDescription, this.http)
        .then((res) => {
          this.showCreateBugSuccessAlert();
          this.bugDescription = "";
        })
        .catch((err) => {
          this.allMyData.logError(this.tabName, "server", "createBug query error: Err msg = " + err, this.http);
          this.showCreateBugFailureAlert();
        });
  }

  private createFeatureRequest(){
    this.allMyData.createFeatureRequest(this.featureRequest, this.http)
    .then((res) => {
      this.showCreateFeatureRequestSuccessAlert();
      this.featureRequest = "";
    })
    .catch((err) => {
      this.allMyData.logError(this.tabName, "server", "createFeatureRequest query error: Err msg = " + err, this.http);
      this.showCreateFeatureRequestFailureAlert();
    });
  }

  private showCreateBugSuccessAlert() {
    let alert = this.alertCtrl.create({
      title: "Thank you for making us aware of the bug! We'll try to fix that soon!"
    });

    alert.addButton({
        text: 'Continue',
        handler: data => {
            
        }
    });
    alert.present();
  }

  private showCreateBugFailureAlert() {
    let alert = this.alertCtrl.create({
      title: 'Please try submitting the bug again - something went wrong.'
    });

    alert.addButton({
        text: 'Continue',
        handler: data => {
            
        }
    });
    alert.present();
  }

  private showCreateFeatureRequestSuccessAlert() {
    let alert = this.alertCtrl.create({
      title: 'Thank you for your great idea!'
    });

    alert.addButton({
        text: 'Continue',
        handler: data => {
            
        }
    });
    alert.present();
  }

  private showCreateFeatureRequestFailureAlert() {
    let alert = this.alertCtrl.create({
      title: 'Please try submitting the feature request again - something went wrong.'
    });

    alert.addButton({
        text: 'Continue',
        handler: data => {
            
        }
    });
    alert.present();
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
      this.notificationsButtonExplanationIsActive = true;
    }
    if(this.numberOfTutorialStepsCompleted == 1){
      this.friendsButtonExplanationIsActive = true;
    }
    if(this.numberOfTutorialStepsCompleted == 2){
      this.feedbackExplanationIsActive = true;
    }
    if(this.numberOfTutorialStepsCompleted == 3){
      this.logoutExplanationIsActive = true;
    }
  }

  overlayWasClicked(){
    this.numberOfTutorialStepsCompleted++;
    this.storage.set("numberOfTutorialStepsCompletedMoreTab", this.numberOfTutorialStepsCompleted);

    this.notificationsButtonExplanationIsActive = false;
    this.friendsButtonExplanationIsActive = false;
    this.feedbackExplanationIsActive = false;
    this.logoutExplanationIsActive = false;

    if(this.numberOfTutorialStepsCompleted == 1){
      this.friendsButtonExplanationIsActive = true;
    }
    if(this.numberOfTutorialStepsCompleted == 2){
      this.feedbackExplanationIsActive = true;
    }
    if(this.numberOfTutorialStepsCompleted == 3){
      this.logoutExplanationIsActive = true;
    }
    if(this.numberOfTutorialStepsCompleted == 4){
      this.overlayIsNowInactive();
    }
  }
  
}
