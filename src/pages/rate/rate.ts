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

      let timeLastRated = Utility.convertDateTimeToISOFormat(new Date());
      let timeOfLastKnownLocation = timeLastRated;
      this.party.invitees.get(this.allMyData.me.facebookID).rating = rating;
      this.party.invitees.get(this.allMyData.me.facebookID).timeLastRated = timeLastRated;
      this.party.invitees.get(this.allMyData.me.facebookID).timeOfLastKnownLocation = timeOfLastKnownLocation;
      this.party.myInviteeInfo.rating = rating;
      this.party.myInviteeInfo.timeLastRated = timeLastRated;
      this.party.myInviteeInfo.timeOfLastKnownLocation = timeOfLastKnownLocation;

      this.party.refreshPartyStats();
      this.allMyData.rateParty(this.party.partyID, this.allMyData.me.facebookID, rating, timeLastRated, timeOfLastKnownLocation, this.http)
        .then((res) => {
          //console.log("Rating the party query succeeded.");
        })
        .catch((err) => {
          console.log(err);
      });
    }
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
        let timeLastRated = Utility.convertDateTimeToISOFormat(new Date());
        let timeOfLastKnownLocation = timeLastRated;
        this.bar.attendees.get(this.allMyData.me.facebookID).rating = rating;
        this.bar.attendees.get(this.allMyData.me.facebookID).timeLastRated = timeLastRated;
        this.bar.attendees.get(this.allMyData.me.facebookID).timeOfLastKnownLocation = timeOfLastKnownLocation;
        this.bar.myAttendeeInfo.rating = rating;
        this.bar.myAttendeeInfo.timeLastRated = timeLastRated;
        this.bar.myAttendeeInfo.timeOfLastKnownLocation = timeOfLastKnownLocation;
        this.bar.refreshBarStats();
        this.allMyData.rateBar(this.bar.barID, this.allMyData.me.facebookID, this.allMyData.me.isMale, this.allMyData.me.name, rating, this.bar.attendees.get(this.allMyData.me.facebookID).status, timeLastRated, timeOfLastKnownLocation, this.http)
          .then((res) => {
            //console.log("Rating the bar query succeeded.");
          })
          .catch((err) => {
            console.log(err);
        });
      }
  }
}
