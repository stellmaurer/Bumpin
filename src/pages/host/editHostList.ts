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
import { NavParams, NavController} from 'ionic-angular';
import { AllMyData} from '../../model/allMyData';
import { Party, Host } from '../../model/party';
import { Bar } from '../../model/bar';
import { Friend } from '../../model/friend';


@Component({
  selector: 'page-editHostList',
  templateUrl: 'editHostList.html'
})
export class EditHostListPage {
    private party : Party;
    private bar : Bar;

    constructor(public allMyData : AllMyData, private navCtrl: NavController, params : NavParams) {
        this.party = params.get("party");
        this.bar = params.get("bar");
    }

    friendSelected(friend : Friend){
        if(this.bar === undefined){
            if(this.party.hosts.has(friend.facebookID)){
                this.party.hosts.delete(friend.facebookID);
            }else{
                var host : Host = new Host();
                host.isMainHost = false;
                host.name = friend.name;
                host.status = "Waiting";
                this.party.hosts.set(friend.facebookID, host);
            }
        }else{
            if(this.bar.hosts.has(friend.facebookID)){
                this.bar.hosts.delete(friend.facebookID);
            }else{
                var host : Host = new Host();
                host.isMainHost = false;
                host.name = friend.name;
                host.status = "Waiting";
                this.bar.hosts.set(friend.facebookID, host);
            }
        }
    }
}
