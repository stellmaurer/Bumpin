import { Component } from '@angular/core';
import { NavParams, NavController} from 'ionic-angular';
import { Person } from '../../model/person';
import { AllMyData} from '../../model/allMyData';
import { Party, Host } from '../../model/party';
import { Bar } from '../../model/bar';
import { CreatePage } from './create';
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
