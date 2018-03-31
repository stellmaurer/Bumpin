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
import { Party, Invitee } from '../../model/party';
import { Friend } from '../../model/friend';


@Component({
  selector: 'page-editInviteeList',
  templateUrl: 'editInviteeList.html'
})
export class EditInviteeListPage {
    private party : Party;
    private initialInviteeList : Map<string, Invitee>;
    private friendsMap : Map<string,Friend>;
    private possibleInvitees : Friend[];

    constructor(public allMyData : AllMyData, private navCtrl: NavController, params : NavParams) {
        this.party = params.get("party");
        this.initialInviteeList = params.get("initialInviteeList");
        this.friendsMap = new Map<string,Friend>();
        for(let i = 0; i < this.allMyData.friends.length; i++){
          this.friendsMap.set(this.allMyData.friends[i].facebookID, this.allMyData.friends[i]);
        }
        this.makeInviteeList();
    }

    // You should be able to see and interact with invitees that aren't your FBfriends but were added by other hosts, so the
    //      list this Invitees button shows needs to include them as well - so make a list containing them, and your FB friends
    makeInviteeList(){
        this.possibleInvitees = this.allMyData.friends.slice();
        if(this.initialInviteeList != null){ // this party already exists (we aren't creating a new party)
        this.initialInviteeList.forEach((value: any, key: string) => {
            if(this.party.invitees.has(key)){ // might have uninvited a person that wasn't my friend
                if(this.friendsMap.has(key) == false){
                    let notYourFriend : Invitee = this.initialInviteeList.get(key);
                    let anotherHostsFriend : Friend = new Friend();
                    anotherHostsFriend.facebookID = key;
                    anotherHostsFriend.isMale = notYourFriend.isMale;
                    anotherHostsFriend.name = notYourFriend.name;
                    this.possibleInvitees.push(anotherHostsFriend);
                }
            }
          });
        }
        this.possibleInvitees.sort(function(a, b){
            if(b.name < a.name){
                return 1;
            }
            if(b.name > a.name){
                return -1;
            }
            return 0;
        });
    }

    friendSelected(friend : Friend){
        if(this.party.invitees.has(friend.facebookID)){
            this.party.invitees.delete(friend.facebookID);
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
        }
    }
}
