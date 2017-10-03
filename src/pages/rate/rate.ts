/********************* NOTE! - still may need to implement this sometime later on if it's an issue
* Edge case: new party data is brought in while the user rates a party.
*     In this case, the new party data will overwrite the local data
*     and may confuse the user.
*/

import { Component, ViewChild, ElementRef } from '@angular/core';
import {Http} from '@angular/http';

import { NavController } from 'ionic-angular';
import {Party} from "../../model/party";
import {Bar, Attendee} from "../../model/bar";
import { AllMyData } from "../../model/allMyData";
import {Utility} from "../../model/utility";
import { Events } from 'ionic-angular';


@Component({
  selector: 'page-rate',
  templateUrl: 'rate.html',
})
export class RatePage {
  public party : Party;
  public bar : Bar;
  constructor(private allMyData : AllMyData, private events : Events, private http:Http, public navCtrl: NavController) {
    //this.party = this.allMyData.invitedTo[0];
    //this.party = null;
    //this.bar = this.allMyData.barsCloseToMe[0];
    //this.bar = null;
  }

  ionViewWillEnter(){
      this.updateTheUI();
      this.events.subscribe("timeToUpdateUI",() => {
        console.log("********************* updating the rate tab UI now");
        this.updateTheUI();
      });
  }

  updateTheUI(){
      this.synchronizeLatestPartyData();
      this.synchronizeLatestBarData();
      if(this.allMyData.thePartyOrBarIAmAt == null){
          this.party = null;
          this.bar = null;
      } else if(this.allMyData.thePartyOrBarIAmAt instanceof Party){
          this.party = this.allMyData.thePartyOrBarIAmAt;
          this.bar = null;
      } else if(this.allMyData.thePartyOrBarIAmAt instanceof Bar){
          this.party = null;
          this.bar = this.allMyData.thePartyOrBarIAmAt;
      } else {
          this.party = null;
          this.bar = null;
          console.log("There's a bug somewhere in the findThePartyOrBarIAmAt function.");
      }
  }


 synchronizeLatestPartyData(){
   if(this.party != null){
    let indexOfParty = Utility.findIndexOfParty(this.party, this.allMyData.invitedTo);
    if(indexOfParty == -1){
      console.log("Party has been removed. You cannot rate it anymore.");
      return;
    }
    this.party = this.allMyData.invitedTo[indexOfParty];
   }
 }

 synchronizeLatestBarData(){
   if(this.bar != null){
    let indexOfBar = Utility.findIndexOfBar(this.bar, this.allMyData.barsCloseToMe);
    if(indexOfBar == -1){
      console.log("Bar has been removed. You cannot rate it anymore.");
      return;
    }
    this.bar = this.allMyData.barsCloseToMe[indexOfBar];
   }
 }

  rateParty(rating : string){
    this.synchronizeLatestPartyData();
    this.allMyData.rateParty(this.party, rating, this.http)
    .then((res) => {
        //console.log("Rating the party query succeeded.");
    })
    .catch((err) => {
        console.log(err);
    });
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
}
