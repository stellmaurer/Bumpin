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
import { App, NavController, AlertController } from 'ionic-angular';
import { AllMyData } from '../../model/allMyData';
import { Login } from '../login/login';
import { Http } from '@angular/http';
import { FriendsPage } from './friends';
import { MyStatusPage } from './myStatus';
import { NotificationsPage } from './notifications';

@Component({
  selector: 'page-more',
  templateUrl: 'more.html'
})
export class MorePage {

  private tabName: string = "More Tab";
  private bugDescription: string;
  private featureRequest: string;

  constructor(private app: App, private login : Login, public allMyData : AllMyData, private http:Http, private navCtrl: NavController, public alertCtrl: AlertController) {
    this.bugDescription = "";
    this.featureRequest = "";
  }

  ionViewDidEnter(){
    this.allMyData.getNotifications(this.http)
    .catch((err) => {
      this.allMyData.logError(this.tabName, "server", "notifications query error : Err msg = " + err, this.http);
    });
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
}
