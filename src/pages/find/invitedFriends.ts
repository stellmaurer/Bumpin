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
  selector: 'page-invitedFriends',
  templateUrl: 'invitedFriends.html'
})
export class InvitedFriendsPage {
    private tabName: string = "Find Tab";
    private party : Party;
    private invitedFriends : Invitee[];
    private going : Invitee[];
    private maybe : Invitee[];
    private invited : Invitee[];

    constructor(public allMyData : AllMyData, private navCtrl: NavController, params : NavParams) {
        this.party = params.get("party");
        this.invitedFriends = new Array<Invitee>();
        this.going = new Array<Invitee>();
        this.maybe = new Array<Invitee>();
        this.invited = new Array<Invitee>();
        this.determineWhichFriendsAreInvitedToTheParty();
    }

    private determineWhichFriendsAreInvitedToTheParty(){
        this.invitedFriends = new Array<Invitee>();
        this.going = new Array<Invitee>();
        this.maybe = new Array<Invitee>();
        this.invited = new Array<Invitee>();
        for(let i = 0; i < this.allMyData.friends.length; i++){
            if(this.party.invitees.has(this.allMyData.friends[i].facebookID) == true){
                let invitee = this.party.invitees.get(this.allMyData.friends[i].facebookID);
                this.invitedFriends.push(invitee);
                if(invitee.status == "Going"){
                    this.going.push(invitee);
                }else if(invitee.status == "Maybe"){
                    this.maybe.push(invitee);
                }else{
                    this.invited.push(invitee);
                }
            }
        }
    }
}
