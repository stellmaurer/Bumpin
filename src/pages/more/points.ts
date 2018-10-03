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
import { NavController, AlertController, PopoverController } from 'ionic-angular';
import { AllMyData } from '../../model/allMyData';
import { Http } from '@angular/http';
import { UseFreeDrinkPopover } from './useFreeDrinkPopover';


@Component({
  selector: 'page-points',
  templateUrl: 'points.html'
})
export class PointsPage {

  private tabName: string = "More Tab";
  private currentlyLoadingData : boolean = false;

  constructor(public allMyData : AllMyData, private http:Http, private navCtrl: NavController, public alertCtrl: AlertController, public popoverCtrl: PopoverController) {
    
  }

  useFreeDrink(){
    this.presentUseFreeDrinkAlert();
  }

  presentUseFreeDrinkAlert() {
    let alert = this.alertCtrl.create();
    alert.setTitle("Are you sure?");
    alert.setSubTitle("Once you hit \"Yes\", you will have 10 seconds to show the bartender your phone to get the free drink.");

    alert.addButton({
      text: 'No',
      handler: data => {
        
      }
    });
    alert.addButton({
      text: 'Yes',
      handler: data => {
        let popover = this.popoverCtrl.create(UseFreeDrinkPopover, {allMyData:this.allMyData, http:this.http, navCtrl:this.navCtrl, alertCtrl:this.alertCtrl}, {cssClass:'useFreeDrinkPopover.scss useFreeDrinkPopover', enableBackdropDismiss: false});
        popover.present();
      }
    });
    alert.present();
  }
  
}
