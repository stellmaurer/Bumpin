/*******************************************************
 * Copyright (C) 2018 Stephen Ellmaurer <stellmaurer@gmail.com>
 * 
 * This file is part of the Bumpin mobile app project.
 * 
 * The Bumpin project and any of the files within the Bumpin
 * project can not be copied and/or distributed without
 * the express permission of Stephen Ellmaurer.
 *******************************************************/

import { Component, NgZone  } from '@angular/core';
import { NavParams, NavController} from 'ionic-angular';
import { AllMyData} from '../../model/allMyData';
import { Party, Invitee } from '../../model/party';
import { Friend } from '../../model/friend';
import { Http } from '@angular/http';


@Component({
  selector: 'page-inviteFriends',
  templateUrl: 'inviteFriends.html'
})
export class InviteFriendsPage {
    private tabName: string = "Find Tab";
    private originalParty : Party;
    private party : Party;
    private inviteesToAdd : Map<string,Invitee>;
    private initialNumberOfInvitationsYouCanGiveOut : number;

    constructor(public allMyData : AllMyData, private navCtrl: NavController, params : NavParams, public zone: NgZone, private http:Http) {
        this.originalParty = params.get("party");
        this.party = this.originalParty.createShallowCopy();
        this.inviteesToAdd = new Map<string,Invitee>();
        this.initialNumberOfInvitationsYouCanGiveOut = this.originalParty.invitees.get(this.allMyData.me.facebookID).numberOfInvitationsLeft;
    }

    friendSelected(friend : Friend){
        this.zone.run(() => {
            if(this.party.invitees.has(friend.facebookID)){
                this.party.invitees.delete(friend.facebookID);
                this.party.invitees.get(this.allMyData.me.facebookID).numberOfInvitationsLeft = this.party.invitees.get(this.allMyData.me.facebookID).numberOfInvitationsLeft + 1;
            }else{
                var invitee : Invitee = new Invitee();
                invitee.atParty = false;
                invitee.isMale = friend.isMale;
                invitee.name = friend.name;
                invitee.numberOfInvitationsLeft = this.party.invitesForNewInvitees;
                invitee.rating = "None";
                invitee.status = "Invited";
                invitee.timeLastRated = "2001-01-01T00:00:00Z";
                invitee.timeOfLastKnownLocation = "2001-01-01T00:00:00Z";
                this.party.invitees.set(friend.facebookID, invitee);
                this.party.invitees.get(this.allMyData.me.facebookID).numberOfInvitationsLeft = this.party.invitees.get(this.allMyData.me.facebookID).numberOfInvitationsLeft - 1;
            }
        });
    }

    private determineWhichInviteesWereAdded(){
        this.party.invitees.forEach((value: any, key: string) => {
            if(this.originalParty.invitees.has(key) == false){
                // person is in the new list but not the old, so they should be in the list to add
                this.inviteesToAdd.set(key, value);
            }
        });
    }

    private sendInvites(){
        this.determineWhichInviteesWereAdded();
        this.allMyData.sendInvitationsAsGuestOfParty(this.originalParty, this.inviteesToAdd, this.http)
        .then((res) => {
            this.navCtrl.pop();
        })
        .catch((err) => {
          this.allMyData.logError(this.tabName, "server", "sendInvitationsAsGuestOfParty query error : Err msg = " + err, this.http);
        });
    }
}
