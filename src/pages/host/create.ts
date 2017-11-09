import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Person } from '../../model/person';
import { AllMyData} from '../../model/allMyData';
import { Party, Host } from '../../model/party';
import { Bar } from '../../model/bar';
import { EditPartyPage } from './editParty';
import { EditBarPage } from './editBar';


@Component({
  selector: 'page-create',
  templateUrl: 'create.html'
})
export class CreatePage {
  private party : Party;
  constructor(public allMyData : AllMyData, private navCtrl: NavController) {
    this.party = new Party();
    this.setMeAsTheMainHost();
  }

  private setMeAsTheMainHost(){
    var mainHost : Host = new Host();
    mainHost.isMainHost = true;
    mainHost.name = this.allMyData.me.name;
    mainHost.status = "Accepted";
    this.party.hosts.set(this.allMyData.me.facebookID, mainHost);
  }

  goToCreatePartyPage(){
    this.navCtrl.push(EditPartyPage, {party:this.party}, {animate: false});
  }

  goToCreateBarPage(){
    this.navCtrl.push(EditBarPage, {}, {animate: false});
  }
}
