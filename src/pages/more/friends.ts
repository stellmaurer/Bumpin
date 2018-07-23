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
import { AllMyData} from '../../model/allMyData';
import { Http } from '@angular/http';
import { Friend } from '../../model/friend';


@Component({
  selector: 'page-friends',
  templateUrl: 'friends.html'
})
export class FriendsPage {
    private tabName: string = "More Tab";
    
    private yes : Friend[];
    private maybe : Friend[];
    private convinceMe : Friend[];
    private no : Friend[];
    private unknown : Friend[];

    private currentlyLoadingData : boolean;

    constructor(private http:Http, public allMyData : AllMyData) {
        this.currentlyLoadingData = true;
        this.clearStatusGroups();
        // friends get initialized upon login, so there's no need to store to retrieve them in local data storage
        this.sortFriendsIntoStatusGroups();
    }

    private clearStatusGroups(){
        this.yes = new Array<Friend>();
        this.maybe = new Array<Friend>();
        this.convinceMe = new Array<Friend>();
        this.no = new Array<Friend>();
        this.unknown = new Array<Friend>();
    }

    ionViewWillEnter(){
        this.currentlyLoadingData = true;
        this.allMyData.refreshFriends(this.http)
        .then((res) => {
            this.currentlyLoadingData = false;
            this.clearStatusGroups();
            this.sortFriendsIntoStatusGroups();
        })
        .catch((err) => {
            this.currentlyLoadingData = false;
            this.allMyData.logError(this.tabName, "server", "refreshFriends query error : Err msg = " + err, this.http);
        });
    }

    private sortFriendsIntoStatusGroups(){
        for(let i = 0; i < this.allMyData.friends.length; i++){
            let friend = this.allMyData.friends[i];
            if (friend.status["goingOut"] == "Unknown"){
                this.unknown.push(friend);
            }else if (friend.status["goingOut"] == "No"){
                this.no.push(friend);
            }else if (friend.status["goingOut"] == "Convince Me"){
                this.convinceMe.push(friend);
            }else if (friend.status["goingOut"] == "Maybe"){
                this.maybe.push(friend);
            }else if (friend.status["goingOut"] == "Yes"){
                this.yes.push(friend);
            }
        }
    }
}
