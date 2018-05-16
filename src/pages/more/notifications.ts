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
import { NavController} from 'ionic-angular';
import { AllMyData} from '../../model/allMyData';
import { Http } from '@angular/http';

@Component({
  selector: 'page-notifications',
  templateUrl: 'notifications.html'
})
export class NotificationsPage {
    private tabName: string = "More Tab";

    constructor(public allMyData : AllMyData, private navCtrl: NavController, private http:Http) {

    }

    ionViewDidEnter(){
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
}
