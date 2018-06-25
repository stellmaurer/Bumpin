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
import { NavController, App, AlertController} from 'ionic-angular';
import { AllMyData} from '../../model/allMyData';
import { Http } from '@angular/http';
import { PushNotification } from '../../model/pushNotification';

@Component({
  selector: 'page-notifications',
  templateUrl: 'notifications.html'
})
export class NotificationsPage {
    private tabName: string = "More Tab";

    constructor(private app : App, public alertCtrl: AlertController, public allMyData : AllMyData, private navCtrl: NavController, private http:Http) {
        
    }

    ionViewDidEnter(){
        this.markNotificationsAsSeen();
    }

    private markNotificationsAsSeen(){
        for(let i = 0; i < this.allMyData.notifications.length; i++){
            let notification = this.allMyData.notifications[i];
            if(notification.hasBeenSeen == false){
                this.allMyData.markNotificationAsSeen(notification, this.http)
                .catch((err) => {
                    this.allMyData.logError(this.tabName, "server", "markNotificationAsSeen query error : Err msg = " + err, this.http);
                });
            }
        }
    }

    private viewNotification(notification : PushNotification){
        if(notification.message.includes("party")){
            if(notification.message.includes("host")){
                if(this.areYouStillAHostOfTheParty(notification.partyOrBarID) == true){
                    this.app.getRootNav().getActiveChildNav().select(2);
                }else{
                    this.presentAlertWithMessage("You are either no longer a host for this party anymore, or this party no longer exists.");
                    this.deleteTheNotification(notification);
                }
            }
            if(notification.message.includes("invited")){
                this.allMyData.storage.set('partyIDForPushNotification', notification.partyOrBarID);
                if(this.areYouStillInvitedToTheParty(notification.partyOrBarID) == true){
                    this.app.getRootNav().getActiveChildNav().select(0);
                }else{
                    this.presentAlertWithMessage("You are either no longer invited to this party, or this party no longer exists.");
                    this.deleteTheNotification(notification);
                }
            }
        }else if(notification.message.includes("bar")){
            if(notification.message.includes("host")){
                if(this.areYouStillAHostOfTheBar(notification.partyOrBarID) == true){
                    this.app.getRootNav().getActiveChildNav().select(2);
                }else{
                    this.presentAlertWithMessage("You are either no longer a host for this bar anymore, or this bar no longer exists.");
                    this.deleteTheNotification(notification);
                }
            }
        }else if(notification.message.includes("go out")){
            let notificationDate = new Date((1000 * notification.expiresAt) - ((1000*60*60*24) * 14));
            let today = new Date();
            if(notificationDate.getFullYear() == today.getFullYear() &&
               notificationDate.getMonth() == today.getMonth() &&
               notificationDate.getDate() == today.getDate()){
                this.allMyData.storage.set('goingOutStatusNotification', "-1");
                this.app.getRootNav().getActiveChildNav().select(3);
            }else{
                this.presentAlertWithMessage("This notification was for an earlier date.");
                this.deleteTheNotification(notification);
            }
            
        }
    }

    private deleteTheNotification(notification : PushNotification){
        this.allMyData.deleteNotification(notification, this.http)
        .catch((err) => {
            this.allMyData.logError(this.tabName, "server", "deleteNotification query error : Err msg = " + err, this.http);
        });
    }

    private areYouStillAHostOfTheParty(partyID : string) : boolean {
        let stillHostOfParty = this.allMyData.me.partyHostFor.has(partyID);
        if(this.allMyData.me.partyHostFor.has(partyID) == true){
            return true;
        }else{
            return false;
        }
    }

    private areYouStillAHostOfTheBar(barID : string) : boolean {
        if(this.allMyData.me.barHostFor.has(barID) == true){
            return true;
        }else{
            return false;
        }
    }

    private areYouStillInvitedToTheParty(partyID : string) : boolean {
        if(this.allMyData.me.invitedTo.has(partyID) == true){
            return true;
        }else{
            return false;
        }
    }

    presentAlertWithMessage(message : string) {
        let alert = this.alertCtrl.create();
        alert.setTitle(message);
        alert.present();
      }
}
