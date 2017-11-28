import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Person } from '../../model/person';
import { AllMyData} from '../../model/allMyData';
import { Party, Host } from '../../model/party';
import { Bar } from '../../model/bar';
import { CreatePartyPage } from './createParty';
import { CreateBarPage } from './createBar';


@Component({
  selector: 'page-create',
  templateUrl: 'create.html'
})
export class CreatePage {
  private party : Party;
  constructor(public allMyData : AllMyData, private navCtrl: NavController) {
    this.party = new Party();
    this.setMeAsTheMainHost();
    this.setDefaultStartAndEndTimesForParty();
  }

  private setMeAsTheMainHost(){
    var mainHost : Host = new Host();
    mainHost.isMainHost = true;
    mainHost.name = this.allMyData.me.name;
    mainHost.status = "Accepted";
    this.party.hosts.set(this.allMyData.me.facebookID, mainHost);
  }

  private setDefaultStartAndEndTimesForParty(){
    // "startDateOnly":"2017-01-01","startTimeOnly":"13:00"
    let date: Date = new Date();
    let year = date.getFullYear();
    let month = (date.getMonth()+1).toString().length == 1 ? '0'+(date.getMonth()+1) : (date.getMonth()+1);
    let day = date.getDate().toString().length == 1 ? '0'+date.getDate() : date.getDate();
    let hour = date.getHours().toString().length == 1 ? '0'+date.getHours() : date.getHours();
    let minutes = date.getMinutes().toString().length == 1 ? '0'+date.getMinutes() : date.getMinutes();
    this.party.startDateOnly = year + "-" + month + "-" + day;
    this.party.startTimeOnly = hour + ":" + minutes;
    this.party.endDateOnly = year + "-" + month + "-" + day;
    this.party.endTimeOnly = hour + ":" + minutes;
  }

  goToCreatePartyPage(){
    this.navCtrl.push(CreatePartyPage, {party:this.party}, {animate: false});
  }

  goToCreateBarPage(){
    this.navCtrl.push(CreateBarPage, {}, {animate: false});
  }
}
