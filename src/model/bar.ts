import {Type} from "serializer.ts/Decorators";
import { AllMyData } from "../model/allMyData";
import { Injectable } from "@angular/core";
import { Utility } from "./utility";

export class Bar {
    public addressLine1 : string;
    public addressLine2 : string;
    public attendees : Map<string, Attendee>;
    public barID : string;
    public city : string;
    public country : string;
    public details : string;
    public hosts : Map<string,Host>;
    public keysInHostsMap : string[];
    public latitude : number;
    public longitude : number;
    public name : string;
    public phoneNumber : string;
    public schedule : Map<string,Schedule>;
    public stateProvinceRegion : string;
    public zipCode : number;

    public averageRating : string;
    public averageRatingNumber : number;
    public bumpinRatings : number;
    public heatingUpRatings : number;
    public decentRatings : number;
    public weakRatings : number;
    public peopleGoing : number;
    public peopleMaybe : number;
    public numberOfPeopleAtBar : number;
    public percentageOfMen : number;
    public percentageOfWomen : number;

    public myAttendeeInfo : Attendee;
    public addressFirstLine : string;
    public addressSecondLine : string;

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
        this.percentageOfMen = 0;
        this.percentageOfWomen = 0;
    }

    public prepareBarObjectForTheUI(){
        this.initializeMyAttendeeInfo();
        this.initializeAddressLines();
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

        let numberOfMen = 0;
        this.attendees.forEach((value: Attendee, key: string) => {
            let attendee = this.attendees.get(key);
            var attendanceIsExpired = Utility.isAttendanceExpired(attendee.timeOfLastKnownLocation);
            if(attendee.atBar && (attendanceIsExpired == false)){
                this.numberOfPeopleAtBar++;
                if(attendee.isMale){
                    numberOfMen++;
                }
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
                    case "Heating Up": {
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
            }
            // Initialize status stats
            switch(attendee.status){
                case "Going": {
                    this.peopleGoing++;
                    break;
                }
                case "Maybe": {
                    this.peopleMaybe++;
                    break;
                }
            }
        });

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
                    this.averageRating = "Heating Up";
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
        this.refreshMyAttendeeInfo();
    }

    private refreshMyAttendeeInfo(){
        if(this.attendees == null){
            this.myAttendeeInfo.rating = "None";
            return;
        }
        if(this.attendees.get("10155613117039816") == null){
            this.myAttendeeInfo.rating = "None";
            return;
        }
        var ratingIsExpired = Utility.isRatingExpired(this.attendees.get("10155613117039816").timeLastRated);
        if(ratingIsExpired == true){
            this.myAttendeeInfo.rating = "None";
        }

        let attendanceIsExpired = Utility.isAttendanceExpired(this.attendees.get("10155613117039816").timeOfLastKnownLocation);
        if(attendanceIsExpired == true){
            this.myAttendeeInfo.atBar = false;
        }
    }

    private initializeMyAttendeeInfo(){
        let fbid = "10155613117039816";
        this.myAttendeeInfo = this.attendees.get(fbid);
        if(this.myAttendeeInfo == null){
            // The UI needs myAttendeeInfo to not be null, so just create
            //      an attendee object locally to take care of this
            var tempAttendee : Attendee = new Attendee();
            tempAttendee.atBar = false;
            tempAttendee.isMale = true;
            tempAttendee.name = "doesn't matter";
            tempAttendee.rating = "None";
            tempAttendee.status = "None";
            tempAttendee.timeLastRated = "2001-01-01T00:00:00Z";
            tempAttendee.timeOfLastKnownLocation = "2001-01-01T00:00:00Z";
            this.myAttendeeInfo = tempAttendee;
        }
    }

    private initializeAddressLines(){
        // addressFirstLine
        this.addressFirstLine = this.addressLine1;
        if(this.addressLine2 != "null"){
            this.addressFirstLine += " " + this.addressLine2;
        }
        // addressSecondLine
        this.addressSecondLine = this.city + ", " + this.stateProvinceRegion + " " + this.zipCode;
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