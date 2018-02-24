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
  private tabName: string = "Find Tab";
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
        return;
    }
    this.party = this.allMyData.invitedTo[indexOfParty];
  }

  rateParty(rating : string){
    this.synchronizeLatestPartyData();
    this.allMyData.rateParty(this.party, rating, this.http)
    .then((res) => {
        
    })
    .catch((err) => {
      this.allMyData.logError(this.tabName, "server", "rateParty query error : Err msg = " + err, this.http);
    });
  }

  changeAttendanceStatus(status : string){
    this.synchronizeLatestPartyData();
    this.allMyData.changeAttendanceStatusToParty(this.party, status, this.http)
    .then((res) => {
        
    })
    .catch((err) => {
      this.allMyData.logError(this.tabName, "server", "changeAttendanceStatusToParty query error : Err msg = " + err, this.http);
    });
  }
}