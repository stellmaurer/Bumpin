import { Type } from "serializer.ts/Decorators";
import { AllMyData } from "./allMyData";
import { Injectable } from "@angular/core";
import { Utility } from "./utility";

export class Party {
    public address : string;
    public details : string;
    public drinksProvided : boolean;
    public endTime : string;
    public feeForDrinks : boolean;
    public hosts : Map<string,Host>;
    public keysInHostsMap : string[];
    public invitees : Map<string,Invitee>;
    public invitesForNewInvitees : number;
    public latitude : number;
    public longitude : number;
    public partyID : string;
    public startTime : string;
    public title : string;

    public averageRating : string;
    public averageRatingNumber : number;
    public bumpinRatings : number;
    public heatingUpRatings : number;
    public decentRatings : number;
    public weakRatings : number;
    public peopleGoing : number;
    public peopleMaybe : number;
    public peopleInvited : number;
    public numberOfPeopleAtParty : number;
    public percentageOfMen : number;
    public percentageOfWomen : number;

    public localStartTime : string;
    public localEndTime : string;

    constructor() {
        this.hosts = new Map<string,Host>();
        this.keysInHostsMap = Array.from(this.hosts.keys());
        this.invitees = new Map<string,Invitee>();
        this.averageRating = "None";
        this.averageRatingNumber = 0;
        this.bumpinRatings = 0;
        this.heatingUpRatings = 0;
        this.decentRatings = 0;
        this.weakRatings = 0;
        this.peopleGoing = 0;
        this.peopleMaybe = 0;
        this.peopleInvited = 0;
        this.numberOfPeopleAtParty = 0;
        this.percentageOfMen = 0;
        this.percentageOfWomen = 0;
    }

    public preparePartyObjectForTheUI(){
        this.localStartTime = Utility.convertTimeToLocalTimeAndFormatForUI(new Date(this.startTime));
        this.localEndTime = Utility.convertTimeToLocalTimeAndFormatForUI(new Date(this.endTime));
        this.refreshPartyStats();
    }

    public fixMaps(){
        var fixedHostsMap = new Map<string,Host>();
        var fixedInviteesMap = new Map<string,Invitee>();
        var hosts = this.hosts;
        var invitees = this.invitees;
        Object.keys(hosts).forEach(function (key) {
            // do something with obj[key]
            fixedHostsMap.set(key, hosts[key]);
        });
        Object.keys(invitees).forEach(function (key) {
            // do something with obj[key]
            fixedInviteesMap.set(key, invitees[key]);
        });
        this.hosts = fixedHostsMap;
        this.invitees = fixedInviteesMap;
        this.keysInHostsMap = Array.from(this.hosts.keys());
    }

    public refreshPartyStats(){
        this.averageRatingNumber = 0;
        this.bumpinRatings = 0;
        this.heatingUpRatings = 0;
        this.decentRatings = 0;
        this.weakRatings = 0;
        this.peopleGoing = 0;
        this.peopleMaybe = 0;
        this.peopleInvited = 0;
        this.numberOfPeopleAtParty = 0;
        this.percentageOfMen = 0;
        this.percentageOfWomen = 0;

        let numberOfMen = 0;
        this.invitees.forEach((value: Invitee, key: string) => {
            let invitee = this.invitees.get(key);
            var attendanceIsExpired = Utility.isAttendanceExpired(invitee.timeOfLastKnownLocation);
            if(invitee.atParty && (attendanceIsExpired == false)){
                this.numberOfPeopleAtParty++;
                if(invitee.isMale){
                    numberOfMen++;
                }
            } else if(invitee.atParty && attendanceIsExpired){
                // really only doing this so that your personal atParty status is correct on the client side
                invitee.atParty = false;
            }
            var ratingIsExpired = Utility.isRatingExpired(invitee.timeLastRated);
            if(ratingIsExpired == false){
                // Initialize rating stats
                switch(invitee.rating){
                    case "Bumpin": {
                        this.bumpinRatings++;
                        this.averageRatingNumber = this.averageRatingNumber+4;
                        break;
                    }
                    case "Heat'n Up": {
                        this.heatingUpRatings++;
                        this.averageRatingNumber = this.averageRatingNumber+3;
                        break;
                    }
                    case "Decent": {
                        this.decentRatings++;
                        this.averageRatingNumber = this.averageRatingNumber+2;
                        break;
                    }
                    case "Weak": {
                        this.weakRatings++;
                        this.averageRatingNumber = this.averageRatingNumber+1;
                        break;
                    }
                }
            }else{
                // rating is expired - only doing this so that your personal rating is correct on the client side
                invitee.rating = "None";
            }
            // Initialize status stats
            switch(invitee.status){
                case "Going": {
                    this.peopleGoing++;
                    break;
                }
                case "Maybe": {
                    this.peopleMaybe++;
                    break;
                }
                case "Invited": {
                    this.peopleInvited++;
                    break;
                }
            }
        });

        if(this.numberOfPeopleAtParty > 0){
            this.percentageOfMen = Math.round((numberOfMen / this.numberOfPeopleAtParty) * 100);
            this.percentageOfWomen = 100 - this.percentageOfMen;
        }else{
            this.percentageOfMen = 0;
            this.percentageOfWomen = 0;
        }
        if((this.bumpinRatings + this.heatingUpRatings + this.decentRatings + this.weakRatings) > 0){
            this.averageRatingNumber = this.averageRatingNumber / (this.bumpinRatings + this.heatingUpRatings + this.decentRatings + this.weakRatings);
            switch(Math.round(this.averageRatingNumber)){
                case 4: {
                    this.averageRating = "Bumpin";
                    break;
                }
                case 3: {
                    this.averageRating = "Heat'n Up";
                    break;
                }
                case 2: {
                    this.averageRating = "Decent";
                    break;
                }
                case 1: {
                    this.averageRating = "Weak";
                    break;
                }
            }
        }else{
            this.averageRatingNumber = 0;
            this.averageRating = "None";
        }
    }
}

export class Host {
    public isMainHost : boolean;
    public name : string;
    public status : string;
    constructor() {}
}

export class Invitee {
    public isMale : boolean;
    public name : string;
    public numberOfInvitationsLeft : number;
    public rating : string;
    public status : string;
    public atParty : boolean;
    public timeLastRated : string;
    public timeOfLastKnownLocation : string;
    constructor() {}
}