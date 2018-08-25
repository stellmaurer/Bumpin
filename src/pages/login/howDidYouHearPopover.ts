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
import { AllMyData} from '../../model/allMyData';
import { Http } from '@angular/http';
import { AlertController, NavController, NavParams, ViewController } from 'ionic-angular';


@Component({
  selector: 'page-howDidYouHearPopover',
  templateUrl: 'howDidYouHearPopover.html'
})
export class HowDidYouHearPopover {
    private tabName : string = "Login";

    private allMyData : AllMyData;
    private http : Http;
    private navCtrl : NavController;
    private alertCtrl: AlertController;

    private inputError : string;
    private howDidYouHear : string;

    private facebook : boolean;
    private sidewalk : boolean;
    private classroom : boolean;
    private friend : boolean;
    private other : boolean;
    
    private specificPersonInput : string;
    private otherInput : string;

    static get parameters() {
        return [[ViewController],[NavParams]];
    }

    constructor(public viewCtrl: ViewController, params : NavParams) {
        this.allMyData = params.get("allMyData");
        this.http = params.get("http");
        this.navCtrl = params.get("navCtrl");
        this.alertCtrl = params.get("alertCtrl");
        this.inputError = "";
        this.howDidYouHear = "";
        this.specificPersonInput = "";
        this.otherInput = "";
        this.facebook = false;
        this.sidewalk = false;
        this.classroom = false;
        this.friend = false;
        this.other = false;
    }

    close() {
        this.viewCtrl.dismiss();
    }

    private showValidationErrorAlert() {
        let alert = this.alertCtrl.create({
          title: this.inputError,
          buttons: ['OK']
        });
        alert.present();
    }

    private showSidewalkAlert(){
        let alert = this.alertCtrl.create({
            message: "Who got you to download the app?",
            inputs: [
              {
                name: "specificPersonInput",
                placeholder: 'Name of person or group'
              },
            ],
            buttons: [
              {
                text: "Not sure",
                handler: data => {
                    this.specificPersonInput = data["specificPersonInput"];
                }
              },
              {
                text: 'Save',
                handler: data => {
                  this.specificPersonInput = data["specificPersonInput"];
                }
              }
            ]
        });
        alert.present();
    }

    private showOtherAlert(){
        let alert = this.alertCtrl.create({
            message: "Tell us what got you to download Bumpin.",
            inputs: [
              {
                name: "otherInput",
                placeholder: 'Explanation'
              },
            ],
            buttons: [
              {
                text: "Not sure",
                handler: data => {
                    this.otherInput = data["otherInput"];
                }
              },
              {
                text: 'Save',
                handler: data => {
                  this.otherInput = data["otherInput"];
                }
              }
            ]
        });
        alert.present();
    }

    private itemSelected(item : string){
        if(item == "facebook"){
            this.facebook = !this.facebook;
        }
        if(item == "sidewalk"){
            this.sidewalk = !this.sidewalk;
            if(this.sidewalk){
                this.showSidewalkAlert();
            }
        }
        if(item == "classroom"){
            this.classroom = !this.classroom;
        }
        if(item == "friend"){
            this.friend = !this.friend;
        }
        if(item == "other"){
            this.other = !this.other;
            if(this.other){
                this.showOtherAlert();
            }
        }
    }

    private submitButtonClicked(){
        this.validateInput();
        if(this.inputError == ""){
            this.createHowDidYouHearString();

            let timer = setInterval(() => {
                if(this.allMyData.me.facebookID != "Not yet set."){
                    clearInterval(timer);
                    this.allMyData.updateWhatGotPersonToDownload(this.howDidYouHear, this.http)
                    .catch((err) => {
                        this.allMyData.logError(this.tabName, "server", "update howDidYouHearInfo query error: Err msg = " + err, this.http);
                    });
                }
            }, 250);

            this.allMyData.storage.set("whatGotPersonToDownload", this.howDidYouHear);

            this.allMyData.events.publish("howDidYouHearPopoverDismissed");
            this.close();
        }else{
            this.showValidationErrorAlert();
        }
    }

    private validateInput(){
        this.inputError = "";
        if((this.facebook || this.sidewalk || this.classroom || this.friend || this.other) == false){
            this.inputError = "Select at least 1 option.";
        }
    }

    private createHowDidYouHearString(){
        this.howDidYouHear = "";

        if(this.facebook){
            this.howDidYouHear += "Facebook";
        }
        if(this.sidewalk){
            if(this.howDidYouHear != ""){
                this.howDidYouHear += ", ";
            }
            this.howDidYouHear += "Sidewalk";
            this.howDidYouHear += " (" + this.specificPersonInput + ")";
        }
        if(this.classroom){
            if(this.howDidYouHear != ""){
                this.howDidYouHear += ", ";
            }
            this.howDidYouHear += "Classroom";
        }
        if(this.friend){
            if(this.howDidYouHear != ""){
                this.howDidYouHear += ", ";
            }
            this.howDidYouHear += "Friend";
        }
        if(this.other){
            if(this.howDidYouHear != ""){
                this.howDidYouHear += ", ";
            }
            this.howDidYouHear += "Other";
            this.howDidYouHear += " (" + this.otherInput + ")";
        }
    }
}
