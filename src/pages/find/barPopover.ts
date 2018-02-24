import { Component } from '@angular/core';
import {ViewController,NavParams, NavController} from 'ionic-angular';
import {Bar, Attendee, Host} from "../../model/bar";
import { AllMyData } from "../../model/allMyData";
import {Http, Headers, RequestOptions} from '@angular/http';
import {Utility} from "../../model/utility";

@Component({
  selector: 'page-barPopover',
  templateUrl: 'barPopover.html'
})

export class BarPopover {
  private tabName: string = "Find Tab";
  public bar : Bar;
  private allMyData : AllMyData;
  private http : Http;

  static get parameters() {
    return [[ViewController],[NavParams]];
  }

  constructor(public viewCtrl: ViewController, params : NavParams) {
    this.allMyData = params.get("allMyData");
    this.http = params.get("http");
    this.bar = params.get("bar");
  }

  ionViewWillEnter(){
    this.synchronizeLatestBarData();
  }

  close() {
    this.viewCtrl.dismiss();
  }

  synchronizeLatestBarData(){
   let indexOfBar = Utility.findIndexOfBar(this.bar, this.allMyData.barsCloseToMe);
    if(indexOfBar == -1){
      return;
    }
    this.bar = this.allMyData.barsCloseToMe[indexOfBar];
 }

  rateBar(rating : string){
    this.synchronizeLatestBarData();
    this.allMyData.rateBar(this.bar, rating, this.http)
        .then((res) => {
        
        })
        .catch((err) => {
          this.allMyData.logError(this.tabName, "server", "rateBar query error : Err msg = " + err, this.http);
        });
  }


  changeAttendanceStatus(status : string){
    this.synchronizeLatestBarData();
    this.allMyData.changeAttendanceStatusToBar(this.bar, status, this.http)
          .then((res) => {
            
          })
          .catch((err) => {
            this.allMyData.logError(this.tabName, "server", "changeAttendanceStatusToBar query error : Err msg = " + err, this.http);
        });

  }
}