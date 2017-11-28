import {Type} from "serializer.ts/Decorators";
import { AllMyData } from "./allMyData";
import { Injectable } from "@angular/core";
import { Utility } from "./utility";

export class Bar {
    public address : string;
    public attendees : Map<string, Attendee>;
    public barID : string;
    public details : string;
    public hosts : Map<string,Host>;
    public keysInHostsMap : string[];
    public latitude : number;
    public longitude : number;
    public name : string;
    public phoneNumber : string;
    public schedule : Map<string,Schedule>;

    public averageRating : string;
    public averageRatingNumber : number;
    public bumpinRatings : number;
    public heatingUpRatings : number;
    public decentRatings : number;
    public weakRatings : number;
    public peopleGoing : number;
    public peopleMaybe : number;
    public numberOfPeopleAtBar : number;
    public numberOfMenGoing : number;
    public numberOfMenMaybe : number;
    public percentageOfMen : number;
    public percentageOfWomen : number;
    public percentageOfMenGoing : number;
    public percentageOfWomenGoing : number;
    public percentageOfMenMaybe : number;
    public percentageOfWomenMaybe : number;

    constructor() {
        this.hosts = new Map<string,Host>();
        this.keysInHostsMap = Array.from(this.hosts.keys());
        this.attendees = new Map<string,Attendee>();
        this.averageRating = "None";
        this.averageRatingNumber = 0;
        this.bumpinRatings = 0;
        this.heatingUpRatings = 0;
        this.decentRatings = 0;
        this.weakRatings = 0;
        this.peopleGoing = 0;
        this.peopleMaybe = 0;
        this.numberOfPeopleAtBar = 0;
        this.numberOfMenGoing = 0;
        this.numberOfMenMaybe = 0;
        this.percentageOfMen = 0;
        this.percentageOfWomen = 0;
        this.percentageOfMenGoing = 0;
        this.percentageOfWomenGoing = 0;
        this.percentageOfMenMaybe = 0;
        this.percentageOfWomenMaybe = 0;
    }

    public prepareBarObjectForTheUI(){
        this.refreshBarStats();
    }

    public fixMaps(){
        var fixedHostsMap = new Map<string,Host>();
        var fixedAttendeesMap = new Map<string,Attendee>();

        var hosts = this.hosts;
        Object.keys(hosts).forEach(function (key) {
            // do something with obj[key]
            fixedHostsMap.set(key, hosts[key]);
        });
        this.hosts = fixedHostsMap;

        if(this.attendees != null){
            var attendees = this.attendees;
            Object.keys(attendees).forEach(function (key) {
                // do something with obj[key]
                fixedAttendeesMap.set(key, attendees[key]);
            });
        }
        this.attendees = fixedAttendeesMap;

        this.keysInHostsMap = Array.from(this.hosts.keys());
    }

    public refreshBarStats(){
        this.averageRatingNumber = 0;
        this.bumpinRatings = 0;
        this.heatingUpRatings = 0;
        this.decentRatings = 0;
        this.weakRatings = 0;
        this.peopleGoing = 0;
        this.peopleMaybe = 0;
        this.numberOfPeopleAtBar = 0;
        this.percentageOfMen = 0;
        this.percentageOfWomen = 0;
        this.percentageOfMenGoing = 0;
        this.percentageOfWomenGoing = 0;
        this.percentageOfMenMaybe = 0;
        this.percentageOfWomenMaybe = 0;
        this.numberOfMenGoing = 0;
        this.numberOfMenMaybe = 0;

        let numberOfMen = 0;
        this.attendees.forEach((value: Attendee, key: string) => {
            let attendee = this.attendees.get(key);
            var attendanceIsExpired = Utility.isAttendanceExpired(attendee.timeOfLastKnownLocation);
            if(attendee.atBar && (attendanceIsExpired == false)){
                this.numberOfPeopleAtBar++;
                if(attendee.isMale){
                    numberOfMen++;
                }
            } else if(attendee.atBar && attendanceIsExpired){
                // really only doing this so that your personal atBar status is correct on the client side
                attendee.atBar = false;
            }
            var ratingIsExpired = Utility.isRatingExpired(attendee.timeLastRated);
            if(ratingIsExpired == false){
                // Initialize rating stats
                switch(attendee.rating){
                    case "Bumpin": {
                        this.bumpinRatings++;
                        this.averageRatingNumber = this.averageRatingNumber+4;
                        break;
                    }
                    case "Heat'n-up": {
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
                attendee.rating = "None";
            }
            // Initialize status stats
            switch(attendee.status){
                case "Going": {
                    this.peopleGoing++;
                    if(attendee.isMale){
                        this.numberOfMenGoing++;
                    }
                    break;
                }
                case "Maybe": {
                    this.peopleMaybe++;
                    if(attendee.isMale){
                        this.numberOfMenMaybe++;
                    }
                    break;
                }
            }
        });
        if(this.peopleGoing > 0){
            this.percentageOfMenGoing = Math.round((this.numberOfMenGoing / this.peopleGoing) * 100);
            this.percentageOfWomenGoing = 100 - this.percentageOfMenGoing;
        }else{
            this.percentageOfMenGoing = 0;
            this.percentageOfWomenGoing = 0;
        }
        if(this.peopleMaybe > 0){
            this.percentageOfMenMaybe = Math.round((this.numberOfMenMaybe / this.peopleMaybe) * 100);
            this.percentageOfWomenMaybe = 100 - this.percentageOfMenMaybe;
        }else{
            this.percentageOfMenMaybe = 0;
            this.percentageOfWomenMaybe = 0;
        }
        if(this.numberOfPeopleAtBar > 0){
            this.percentageOfMen = Math.round((numberOfMen / this.numberOfPeopleAtBar) * 100);
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
                    this.averageRating = "Heat'n-up";
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

export class Attendee {
    public atBar : boolean;
    public isMale : boolean;
    public name : string;
    public rating : string;
    public status : string;
    public timeLastRated : string;
    public timeOfLastKnownLocation : string;
    constructor() {}
}

export class Host {
    public isMainHost : boolean;
    public name : string;
    public status : string;
    constructor() {}
}

export class Schedule {
    public lastCall : string;
    public open : string;
    constructor() {}
}