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
import { NavController, NavParams, ViewController } from 'ionic-angular';


@Component({
  selector: 'page-useFreeDrinkPopover',
  templateUrl: 'useFreeDrinkPopover.html'
})
export class UseFreeDrinkPopover {
    private tabName : string = "More Tab";

    private allMyData : AllMyData;
    private http : Http;
    private navCtrl : NavController;
    private secondsLeft : number;
    private countdownTimer : NodeJS.Timer;

    static get parameters() {
        return [[ViewController],[NavParams]];
    }

    constructor(public viewCtrl: ViewController, params : NavParams) {
        this.allMyData = params.get("allMyData");
        this.http = params.get("http");
        this.navCtrl = params.get("navCtrl");
        this.secondsLeft = 10;
        this.startCountdown();
    }

    startCountdown(){
        this.countdownTimer = setInterval(() => {
            this.secondsLeft--;
            if(this.secondsLeft == 0){
                clearInterval(this.countdownTimer);
                this.close();
            }
        }, 1000);
    }

    close() {
        this.viewCtrl.dismiss();
    }

}
