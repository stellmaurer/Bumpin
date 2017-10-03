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
      console.log("Bar has been removed. You cannot rate it anymore.");
      return;
    }
    this.bar = this.allMyData.barsCloseToMe[indexOfBar];
 }

  rateBar(rating : string){
    this.synchronizeLatestBarData();
    this.allMyData.rateBar(this.bar, rating, this.http)
        .then((res) => {
        //console.log("Rating the bar query succeeded.");
        })
        .catch((err) => {
        console.log(err);
    });
  }


  changeAttendanceStatus(status : string){
    this.synchronizeLatestBarData();
    this.allMyData.changeAttendanceStatusToBar(this.bar, status, this.http)
          .then((res) => {
            //console.log("Changing attendance status to the bar query succeeded.");
          })
          .catch((err) => {
            console.log(err);
        });

  }
}