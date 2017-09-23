/********************* NOTE! - still may need to implement this sometime later on if it's an issue
* Edge case: new party data is brought in while the user rates a party.
*     In this case, the new party data will overwrite the local data
*     and may confuse the user.
*/

import { Component, ViewChild, ElementRef } from '@angular/core';
import {Http} from '@angular/http';

import { NavController } from 'ionic-angular';
import {Party} from "../../model/party";
import { AllMyData } from "../../model/allMyData";
import {Utility} from "../../model/utility";

@Component({
  selector: 'page-rate',
  templateUrl: 'rate.html',
})
export class RatePage {
  public party : Party;

  constructor(private allMyData : AllMyData, private http:Http, public navCtrl: NavController) {
    this.party = this.allMyData.invitedTo[0];
  }

  ionViewWillEnter(){
    this.synchronizeLatestPartyData();
  }


 synchronizeLatestPartyData(){
   let indexOfParty = Utility.findIndexOfParty(this.party, this.allMyData.invitedTo);
    if(indexOfParty == -1){
      console.log("Party has been removed. You cannot rate it anymore.");
      return;
    }
    this.party = this.allMyData.invitedTo[indexOfParty];
 }

  rateParty(rating : string){
    this.synchronizeLatestPartyData();
    this.party.invitees.get(this.allMyData.me.facebookID).atParty = true;
    if(rating != this.party.invitees.get(this.allMyData.me.facebookID).rating){
      switch(this.party.invitees.get(this.allMyData.me.facebookID).rating){
          case "Bumpin": {
              this.party.bumpinRatings--;
              break;
          }
          case "Heating Up": {
              this.party.heatingUpRatings--;
              break;
          }
          case "Decent": {
              this.party.decentRatings--;
              break;
          }
          case "Weak": {
              this.party.weakRatings--;
              break;
          }
      }

      switch(rating){
          case "Bumpin": {
              this.party.bumpinRatings++;
              break;
          }
          case "Heating Up": {
              this.party.heatingUpRatings++;
              break;
          }
          case "Decent": {
              this.party.decentRatings++;
              break;
          }
          case "Weak": {
              this.party.weakRatings++;
              break;
          }
      }

      var timeLastRated = Utility.convertDateTimeToISOFormat(new Date());
      this.party.invitees.get(this.allMyData.me.facebookID).rating = rating;
      this.party.myInviteeInfo.rating = rating;
      this.party.myInviteeInfo.timeLastRated = timeLastRated;

      this.party.refreshPartyStats();
      this.allMyData.rateParty(this.party.partyID, this.allMyData.me.facebookID, rating, timeLastRated, this.http)
        .then((res) => {
          console.log("Rating the party query succeeded.");
        })
        .catch((err) => {
          console.log(err);
      });
    }
  }
}
