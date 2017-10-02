import { Component } from '@angular/core';
import {ViewController,NavParams, NavController} from 'ionic-angular';
import {Party} from "../../model/party";
import { AllMyData } from "../../model/allMyData";
import {Http, Headers, RequestOptions} from '@angular/http';
import {Utility} from "../../model/utility";


@Component({
  selector: 'page-partyPopover',
  templateUrl: 'partyPopover.html'
})

export class PartyPopover {
  public party : Party;
  private allMyData : AllMyData;
  private http : Http;
  private params : NavParams;

  static get parameters() {
    return [[ViewController],[NavParams]];
  }

  constructor(public viewCtrl: ViewController, params : NavParams) {
    this.params = params;
    this.allMyData = params.get("allMyData");
    this.http = params.get("http");
    this.party = params.get("party");
  }

  ionViewWillEnter(){
    this.synchronizeLatestPartyData();
  }

  close() {
    this.viewCtrl.dismiss();
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
    var ratingIsExpired = Utility.isRatingExpired(this.party.invitees.get(this.allMyData.me.facebookID).timeLastRated);
    if(rating != this.party.invitees.get(this.allMyData.me.facebookID).rating){
      if(ratingIsExpired == false){
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

  changeAttendanceStatus(status : string){
    this.synchronizeLatestPartyData();
    if(status != this.party.invitees.get(this.allMyData.me.facebookID).status){
      switch(this.party.invitees.get(this.allMyData.me.facebookID).status){
          case "Going": {
              this.party.peopleGoing--;
              break;
          }
          case "Maybe": {
              this.party.peopleMaybe--;
              break;
          }
          case "Invited": {
              this.party.peopleInvited--;
              break;
          }
      }

      switch(status){
          case "Going": {
              this.party.peopleGoing++;
              break;
          }
          case "Maybe": {
              this.party.peopleMaybe++;
              break;
          }
          case "Invited": {
              this.party.peopleInvited++;
              break;
          }
      }
      this.party.invitees.get(this.allMyData.me.facebookID).status = status;
      this.allMyData.changeAttendanceStatusToParty(this.party.partyID, this.allMyData.me.facebookID, status, this.http)
        .then((res) => {
          //console.log("Changing attendance status to the party query succeeded.");
        })
        .catch((err) => {
          console.log(err);
      });
    }
  }
}