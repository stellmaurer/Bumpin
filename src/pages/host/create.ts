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
  private bar : Bar;

  constructor(public allMyData : AllMyData, private navCtrl: NavController) {
    this.party = new Party();
    this.bar = new Bar();
    this.setMeAsTheMainHost();
    this.party.setDefaultStartAndEndTimesForParty();
  }

  private setMeAsTheMainHost(){
    var mainHost : Host = new Host();
    mainHost.isMainHost = true;
    mainHost.name = this.allMyData.me.name;
    mainHost.status = "Accepted";
    this.party.hosts.set(this.allMyData.me.facebookID, mainHost);
    this.bar.hosts.set(this.allMyData.me.facebookID, mainHost);
  }

  goToCreatePartyPage(){
    this.navCtrl.push(CreatePartyPage, {party:this.party}, {animate: false});
  }

  goToCreateBarPage(){
    this.navCtrl.push(CreateBarPage, {bar:this.bar}, {animate: false});
  }
}
