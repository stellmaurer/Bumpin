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
      // If you're not an attendee of the bar, make yourself an attendee
      if(this.bar.attendees.get(this.allMyData.me.facebookID) == null){
        var newAttendee = new Attendee();
        newAttendee.atBar = true;
        newAttendee.isMale = this.allMyData.me.isMale;
        newAttendee.name = this.allMyData.me.name;
        newAttendee.rating = "None";
        newAttendee.status = "None";
        newAttendee.timeLastRated = "2001-01-01T00:00:00Z";
        this.bar.attendees.set(this.allMyData.me.facebookID, newAttendee);
        this.bar.myAttendeeInfo = newAttendee;
      }

      this.bar.attendees.get(this.allMyData.me.facebookID).atBar = true;
      if(rating != this.bar.attendees.get(this.allMyData.me.facebookID).rating){
        switch(this.bar.attendees.get(this.allMyData.me.facebookID).rating){
            case "Bumpin": {
                this.bar.bumpinRatings--;
                break;
            }
            case "Heating Up": {
                this.bar.heatingUpRatings--;
                break;
            }
            case "Decent": {
                this.bar.decentRatings--;
                break;
            }
            case "Weak": {
                this.bar.weakRatings--;
                break;
            }
        }

        switch(rating){
            case "Bumpin": {
                this.bar.bumpinRatings++;
                break;
            }
            case "Heating Up": {
                this.bar.heatingUpRatings++;
                break;
            }
            case "Decent": {
                this.bar.decentRatings++;
                break;
            }
            case "Weak": {
                this.bar.weakRatings++;
                break;
            }
        }
        var timeLastRated = Utility.convertDateTimeToISOFormat(new Date());
        this.bar.attendees.get(this.allMyData.me.facebookID).rating = rating;
        this.bar.attendees.get(this.allMyData.me.facebookID).timeLastRated = Utility.convertDateTimeToISOFormat(new Date());
        this.bar.myAttendeeInfo.rating = rating;
        this.bar.myAttendeeInfo.timeLastRated = timeLastRated;
        this.bar.refreshBarStats();
        this.allMyData.rateBar(this.bar.barID, this.allMyData.me.facebookID, this.allMyData.me.isMale, this.allMyData.me.name, rating, this.bar.attendees.get(this.allMyData.me.facebookID).status, timeLastRated, this.http)
          .then((res) => {
            //console.log("Rating the bar query succeeded.");
          })
          .catch((err) => {
            console.log(err);
        });
      }
  }


  changeAttendanceStatus(status : string){
    this.synchronizeLatestBarData();
    var timeLastRated = "2001-01-01T00:00:00Z";
    if(this.bar.attendees.get(this.allMyData.me.facebookID) != null){
      if(status != this.bar.attendees.get(this.allMyData.me.facebookID).status){
        switch(this.bar.attendees.get(this.allMyData.me.facebookID).status){
            case "Going": {
                this.bar.peopleGoing--;
                break;
            }
            case "Maybe": {
                this.bar.peopleMaybe--;
                break;
            }
        }

        switch(status){
            case "Going": {
                this.bar.peopleGoing++;
                break;
            }
            case "Maybe": {
                this.bar.peopleMaybe++;
                break;
            }
        }
        this.bar.attendees.get(this.allMyData.me.facebookID).status = status;
      }
    }else{
      switch(status){
          case "Going": {
              this.bar.peopleGoing++;
              break;
          }
          case "Maybe": {
              this.bar.peopleMaybe++;
              break;
          }
      }
      var newAttendee = new Attendee();
      newAttendee.atBar = false;
      newAttendee.isMale = this.allMyData.me.isMale;
      newAttendee.name = this.allMyData.me.name;
      newAttendee.rating = "None";
      newAttendee.status = status;
      newAttendee.timeLastRated = "2001-01-01T00:00:00Z";
      this.bar.attendees.set(this.allMyData.me.facebookID, newAttendee);
    }
    var me = this.bar.attendees.get(this.allMyData.me.facebookID);
    this.bar.myAttendeeInfo = me;
    this.allMyData.changeAttendanceStatusToBar(this.bar.barID, this.allMyData.me.facebookID, me.atBar, me.isMale, me.name, me.rating, me.status, me.timeLastRated, this.http)
          .then((res) => {
            //console.log("Changing attendance status to the bar query succeeded.");
          })
          .catch((err) => {
            console.log(err);
        });

  }
}