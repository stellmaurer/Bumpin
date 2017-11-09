import { Component } from '@angular/core';
import { NavParams, NavController} from 'ionic-angular';
import { Person } from '../../model/person';
import { AllMyData} from '../../model/allMyData';
import { Party, Invitee } from '../../model/party';
import { Bar } from '../../model/bar';
import { CreatePage } from './create';
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
        console.log("In constructor of editInviteeList");
        this.party = params.get("party");
        this.initialInviteeList = params.get("initialInviteeList");
        this.friendsMap = new Map<string,Friend>();
        for(let i = 0; i < this.allMyData.friends.length; i++){
          this.friendsMap.set(this.allMyData.friends[i].facebookID, this.allMyData.friends[i]);
        }
        this.possibleInvitees = this.allMyData.friends.slice();
        this.makeInviteeList();
        //this.allMyData.friends.sort();
        console.log("********** Friends:");
        for(let i = 0; i < this.allMyData.friends.length; i++){
            console.log(this.allMyData.friends[i].name + ", " + this.allMyData.friends[i].facebookID);
        }
    }

    // You should be able to see and interact with invitees that aren't your FBfriends but were added by other hosts, so the
    //      list this Invitees button shows needs to include them as well - so make a list containing them, and your FB friends
    makeInviteeList(){
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
    }

    friendSelected(friend : Friend){
        console.log(friend.name + ", " + friend.facebookID);
        console.log("********** Before the click:");
        this.party.invitees.forEach((value: Invitee, key: string) => {
            console.log(value.name);
        });
        if(this.party.invitees.has(friend.facebookID)){
            this.party.invitees.delete(friend.facebookID);
            console.log("You just uninvited " + friend.name);
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
            console.log("You just invited " + friend.name);
        }
        console.log("********** After the click:");
        this.party.invitees.forEach((value: Invitee, key: string) => {
            console.log(value.name);
        });
    }
}
