import { Component } from '@angular/core';
import {ViewController,NavParams, NavController} from 'ionic-angular';
import {Party} from "../../model/party";
import { AllMyData } from "../../model/allMyData";
import {Http, Headers, RequestOptions} from '@angular/http';

@Component({
  selector: 'page-partyPopover',
  templateUrl: 'partyPopover.html'
})

export class PartyPopover {
  public party : Party;
  private allMyData : AllMyData;
  private http : Http;

  static get parameters() {
    return [[ViewController],[NavParams]];
  }

  constructor(public viewCtrl: ViewController, params : NavParams) {
    this.allMyData = params.get("allMyData");
    this.http = params.get("http");
    this.party = params.get("party");
  }

  close() {
    this.viewCtrl.dismiss();
  }

  rateParty(rating : string){
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
      this.party.invitees.get(this.allMyData.me.facebookID).rating = rating;
      this.party.refreshPartyStats();
      this.allMyData.rateParty(this.party.partyID, this.allMyData.me.facebookID, rating, this.http)
        .then((res) => {
          
        })
        .catch((err) => {
          console.log(err);
      });
    }
  }


  changeAttendanceStatus(status : string){
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
          
        })
        .catch((err) => {
          console.log(err);
      });
    }
  }
}