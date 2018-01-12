import { Component } from '@angular/core';
import { NavParams, NavController, AlertController} from 'ionic-angular';
import { Person } from '../../model/person';
import { AllMyData} from '../../model/allMyData';
import { Party } from '../../model/party';
import { Bar } from '../../model/bar';
import { CreatePage } from './create';
import { EditPartyPage } from './editParty';
import { EditBarPage } from './editBar';
import { Http } from '@angular/http';
import { NgZone } from '@angular/core';

@Component({
  selector: 'page-host',
  templateUrl: 'host.html'
})
export class HostPage {

  constructor(private zone: NgZone, public allMyData : AllMyData, private http:Http, private navCtrl: NavController, public alertCtrl: AlertController) {
  }

  ionViewDidLoad(){
    
  }

  ionViewDidEnter(){
    this.allMyData.refreshPerson(this.http)
    .then((res) => {

      this.allMyData.refreshPartiesImHosting(this.http)
      .then((res) => {
      })
      .catch((err) => {
        console.log(err);
      });

      this.allMyData.refreshBarsImHosting(this.http)
      .then((res) => {
      })
      .catch((err) => {
        console.log(err);
      });

    })
    .catch((err) => {
      console.log(err);
    });
  }

  partySelected(party : Party) {
    console.log(party.title + " selected");
    if(party.hosts.get(this.allMyData.me.facebookID).status == "Waiting"){
      this.acceptOrDeclineHostingAPartyAlert(party);
    }else{
      this.navCtrl.push(EditPartyPage, {party: party}, {animate: false});
    }
  }

  barSelected(bar : Bar) {
    console.log(bar.name + " selected");
    if(bar.hosts.get(this.allMyData.me.facebookID).status == "Waiting"){
      this.acceptOrDeclineHostingABarAlert(bar);
    }else{
      this.navCtrl.push(EditBarPage, {bar: bar}, {animate: false});
    }
  }

  goToCreatePage(){
    this.navCtrl.push(CreatePage, {}, {animate: false});
  }

  private acceptOrDeclineHostingAPartyAlert(party : Party) {
    let nameOfMainHost = "";
    for(let i = 0; i < party.keysInHostsMap.length; i++){
      if(party.hosts.get(party.keysInHostsMap[i]).isMainHost){
        nameOfMainHost = party.hosts.get(party.keysInHostsMap[i]).name;
      }
    }
    let alert = this.alertCtrl.create({
      title: nameOfMainHost + ' asked you to host this party with them. What would you like to do?'
    });
    alert.addButton({
        text: 'Decline',
        handler: data => {
          this.allMyData.declineInvitationToHostParty(party, this.http)
          .then((res) => {
            this.locallyRemovePartyFromPartiesImHosting(party);
          })
          .catch((err) => {
              console.log(err);
          });
        }
    });
    alert.addButton({
        text: 'Accept',
        handler: data => {
            this.allMyData.acceptInvitationToHostParty(party, this.http)
            .then((res) => {
              party.hosts.get(this.allMyData.me.facebookID).status = "Accepted";
              this.navCtrl.push(EditPartyPage, {party: party}, {animate: false});
            })
            .catch((err) => {
                console.log(err);
            });
        }
    });
    alert.present();
  }

  private acceptOrDeclineHostingABarAlert(bar : Bar) {
    let nameOfMainHost = "";
    for(let i = 0; i < bar.keysInHostsMap.length; i++){
      if(bar.hosts.get(bar.keysInHostsMap[i]).isMainHost){
        nameOfMainHost = bar.hosts.get(bar.keysInHostsMap[i]).name;
      }
    }
    let alert = this.alertCtrl.create({
      title: nameOfMainHost + ' asked you to host this bar with them. What would you like to do?'
    });
    alert.addButton({
        text: 'Decline',
        handler: data => {
          this.allMyData.declineInvitationToHostBar(bar, this.http)
          .then((res) => {
            this.locallyRemoveBarFromBarsImHosting(bar);
          })
          .catch((err) => {
              console.log(err);
          });
        }
    });
    alert.addButton({
        text: 'Accept',
        handler: data => {
            this.allMyData.acceptInvitationToHostBar(bar, this.http)
            .then((res) => {
              bar.hosts.get(this.allMyData.me.facebookID).status = "Accepted";
              this.navCtrl.push(EditBarPage, {bar: bar}, {animate: false});
            })
            .catch((err) => {
                console.log(err);
            });
        }
    });
    alert.present();
  }

  private locallyRemovePartyFromPartiesImHosting(party : Party){
    let newPartyHostForArray : Party[] = new Array<Party>();
    for(let i = 0; i < this.allMyData.partyHostFor.length; i++){
      if(this.allMyData.partyHostFor[i].partyID != party.partyID){
        newPartyHostForArray.push(this.allMyData.partyHostFor[i]);
      }
    }
    this.allMyData.partyHostFor = newPartyHostForArray;
  }

  private locallyRemoveBarFromBarsImHosting(bar : Bar){
    let newBarHostForArray : Bar[] = new Array<Bar>();
    for(let i = 0; i < this.allMyData.barHostFor.length; i++){
      if(this.allMyData.barHostFor[i].barID != bar.barID){
        newBarHostForArray.push(this.allMyData.barHostFor[i]);
      }
    }
    this.allMyData.barHostFor = newBarHostForArray;
  }
}
