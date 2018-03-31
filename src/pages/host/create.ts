/*******************************************************
 * Copyright (C) 2018 Stephen Ellmaurer <stellmaurer@gmail.com>
 * 
 * This file is part of the Bumpin mobile app project.
 * 
 * The Bumpin project and any of the files within the Bumpin
 * project can not be copied and/or distributed without
 * the express permission of Stephen Ellmaurer.
 *******************************************************/

import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
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
