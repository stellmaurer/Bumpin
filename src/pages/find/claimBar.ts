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
import { Http } from '@angular/http';
import { NavParams, NavController, AlertController, App} from 'ionic-angular';
import { AllMyData} from '../../model/allMyData';
import { Bar, Host } from '../../model/bar';

@Component({
  selector: 'page-claimBar',
  templateUrl: 'claimBar.html'
})
export class ClaimBarPage {

  private tabName: string = "Host Tab";
  private bar : Bar;
  private claimKeyAccepted : boolean;
  private currentlyLoadingData : boolean;

  constructor(public zone: NgZone, public app: App, public allMyData : AllMyData, private http:Http, private navCtrl: NavController, params : NavParams, public alertCtrl: AlertController) {
    this.bar = params.get("bar");
    this.claimKeyAccepted = false;
    this.currentlyLoadingData = false;
  }

  ionViewWillLeave(){
    
  }

  ionViewDidLoad(){
    
  }

  private keyUpInClaimKeyInput(event : any){
    if((this.bar.key.length == 16) || (event.keyCode == 13)){
      this.getBarForClaimKey();
    }
  }

  private getBarForClaimKey(){
    this.currentlyLoadingData = true;
    this.allMyData.getBarIDForClaimKey(this.bar, this.http)
    .then((barID : string) => {
      this.zone.run(() => {
        let claimKey = this.bar.key;
        this.bar = this.getBarFromBarID(barID);
        this.bar.key = claimKey;
        this.claimKeyAccepted = true;
        this.currentlyLoadingData = false;
      });
    })
    .catch((err) => {
      this.currentlyLoadingData = false;
      this.presentGetClaimKeyErrorAlert();
      this.allMyData.logError(this.tabName, "server", "getBarForClaimKey query error: Err msg = " + err, this.http);
    });
  }

  private getBarFromBarID(barID : string){
    if(this.allMyData.barsCloseToMeMap.has(barID) == true){
      return this.allMyData.barsCloseToMeMap.get(barID);
    }
    for(let i = 0; i < this.allMyData.barHostFor.length; i++){
      if(barID == this.allMyData.barHostFor[i].barID){
        return this.allMyData.barHostFor[i];
      }
    }
    return null;
  }

  private getClaimKeyButtonClicked(){
    let alert = this.alertCtrl.create();
    alert.setTitle("Email us to get a claim key");
    alert.setSubTitle("Include a picture which shows that you work at or own the bar at that address - a picture of you working at the bar, or a picture of the utility bill or lease agreement with the address showing will do.");

    alert.addButton({
      text: 'Not now',
      handler: data => {
        
      }
    });
    alert.addButton({
      text: 'Email us',
      handler: data => {
        window.open("mailto:bumpin.inc@gmail.com?subject=Claim%20Key%20-%20Proof%20of%20address%20for%20" + encodeURIComponent(this.bar.name) + " [" + this.bar.barID + "]");
      }
    });
    alert.present();
  }

  private presentGetClaimKeyErrorAlert(){
    let alert = this.alertCtrl.create({
      title: 'Error :(',
      subTitle: "This is not a valid claim key.",
      buttons: ['OK']
    });
    alert.present();
  }

  private presentClaimErrorAlert(){
    let alert = this.alertCtrl.create({
      title: 'Error :(',
      subTitle: "This may be our fault. Restart your app and try again. If you get an error again, please send us feedback and we will look into it right away.",
      buttons: ['OK']
    });
    alert.present();
  }

  private claimButtonClicked(){
      this.currentlyLoadingData = true;
      this.allMyData.claimBar(this.bar, this.http)
      .then((res) => {
        this.currentlyLoadingData = false;
        this.updateMyLocalDataToEnsureUserSeesChanges();
        this.navCtrl.pop();
        this.app.getRootNav().getActiveChildNav().select(2);
      })
      .catch((err) => {
          this.allMyData.logError(this.tabName, "server", "claimBar query error: Err msg = " + err, this.http);
          this.presentClaimErrorAlert();
      });
  }

  private updateMyLocalDataToEnsureUserSeesChanges(){
    // If the user has a bad internet connection, data might not appear changed, but
    //    with this, it will appear changed.
    for(let i = 0; i < this.allMyData.barsCloseToMe.length; i++){
      if(this.allMyData.barsCloseToMe[i].barID == this.bar.barID){
        this.allMyData.barsCloseToMe[i] = this.bar;
        break;
      }
    }
    for(let i = 0; i < this.allMyData.barHostFor.length; i++){
      if(this.allMyData.barHostFor[i].barID == this.bar.barID){
        this.allMyData.barHostFor[i] = this.bar;
        break;
      }
    }
  }
}
