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
    public numberOfMenGoing : number;
    public numberOfMenMaybe : number;
    public numberOfMenInvited : number;
    public percentageOfMen : number;
    public percentageOfWomen : number;
    public percentageOfMenGoing : number;
    public percentageOfWomenGoing : number;
    public percentageOfMenMaybe : number;
    public percentageOfWomenMaybe : number;
    public percentageOfMenInvited : number;
    public percentageOfWomenInvited : number;

    public startDateOnly : string;
    public endDateOnly : string;
    public startTimeOnly : string;
    public endTimeOnly : string;

    public localStartTime : string;
    public localEndTime : string;

    constructor() {
        this.partyID = "New Party";
        this.hosts = new Map<string,Host>();
        this.keysInHostsMap = Array.from(this.hosts.keys());
        this.invitees = new Map<string,Invitee>();
        this.title = "";
        this.details = "";
        this.address = "";
        this.latitude = 1000; // represents an illegitimate address
        this.longitude = 1000; // represents an illegitimate address
        this.startDateOnly = "";
        this.endDateOnly = "";
        this.startTimeOnly = "";
        this.endTimeOnly = "";
        this.drinksProvided = false;
        this.feeForDrinks = true;
        this.invitesForNewInvitees = 0;
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
        this.numberOfMenGoing = 0;
        this.numberOfMenMaybe = 0;
        this.numberOfMenInvited = 0;
        this.percentageOfMen = 0;
        this.percentageOfWomen = 0;
        this.percentageOfMenGoing = 0;
        this.percentageOfWomenGoing = 0;
        this.percentageOfMenMaybe = 0;
        this.percentageOfWomenMaybe = 0;
        this.percentageOfMenInvited = 0;
        this.percentageOfWomenInvited = 0;
    }

    public createShallowCopy() : Party{
        let copy : Party = new Party();
        copy.address = this.address;
        copy.details = this.details;
        copy.drinksProvided = this.drinksProvided;
        copy.endTime = this.endTime;
        copy.feeForDrinks = this.feeForDrinks;
        copy.hosts = this.createCopyOfHostsMap();
        copy.invitees = this.createCopyOfInviteesMap();
        copy.invitesForNewInvitees = this.invitesForNewInvitees;
        copy.latitude = this.latitude;
        copy.longitude = this.longitude;
        copy.partyID = this.partyID;
        copy.startTime = this.startTime;
        copy.title = this.title;
        copy.startDateOnly = this.startDateOnly;
        copy.endDateOnly = this.endDateOnly;
        copy.startTimeOnly = this.startTimeOnly;
        copy.endTimeOnly = this.endTimeOnly;
        return copy;
    }

    private createCopyOfHostsMap() : Map<string,Host> {
        let hostsCopy = new Map<string,Host>();
        this.hosts.forEach((value: any, key: string) => {
            hostsCopy.set(key,value);
        });
        return hostsCopy;
    }

    private createCopyOfInviteesMap() : Map<string,Invitee> {
        let inviteesCopy = new Map<string,Invitee>();
        this.invitees.forEach((value: any, key: string) => {
            inviteesCopy.set(key,value);
        });
        return inviteesCopy;
    }

    public preparePartyObjectForTheUI(){
        this.localStartTime = Utility.convertTimeToLocalTimeAndFormatForUI(new Date(this.startTime));
        this.localEndTime = Utility.convertTimeToLocalTimeAndFormatForUI(new Date(this.endTime));
        this.refreshPartyStats();
        this.preparePartyForEditPartyPage();
    }

    public fixMaps(){
        let fixedHostsMap = new Map<string,Host>();
        let fixedInviteesMap = new Map<string,Invitee>();
        let hosts = this.hosts;
        let invitees = this.invitees;
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
        this.percentageOfMenGoing = 0;
        this.percentageOfWomenGoing = 0;
        this.percentageOfMenMaybe = 0;
        this.percentageOfWomenMaybe = 0;
        this.percentageOfMenInvited = 0;
        this.percentageOfWomenInvited = 0;
        this.numberOfMenGoing = 0;
        this.numberOfMenMaybe = 0;
        this.numberOfMenInvited = 0;

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
                invitee.rating = "None";
            }
            // Initialize status stats
            switch(invitee.status){
                case "Going": {
                    this.peopleGoing++;
                    if(invitee.isMale){
                        this.numberOfMenGoing++;
                    }
                    break;
                }
                case "Maybe": {
                    this.peopleMaybe++;
                    if(invitee.isMale){
                        this.numberOfMenMaybe++;
                    }
                    break;
                }
                case "Invited": {
                    this.peopleInvited++;
                    if(invitee.isMale){
                        this.numberOfMenInvited++;
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
        if(this.peopleInvited > 0){
            this.percentageOfMenInvited = Math.round((this.numberOfMenInvited / this.peopleInvited) * 100);
            this.percentageOfWomenInvited = 100 - this.percentageOfMenInvited;
        }else{
            this.percentageOfMenInvited = 0;
            this.percentageOfWomenInvited = 0;
        }
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

    private preparePartyForEditPartyPage(){
        this.setStartAndEndTimesForParty();
    }

    private setStartAndEndTimesForParty(){
        // "startDateOnly":"2017-01-01","startTimeOnly":"13:00"
        let startDate : Date = new Date(this.startTime);
        let endDate : Date = new Date(this.endTime);

        let startYear = startDate.getFullYear();
        let startMonth = (startDate.getMonth()+1).toString().length == 1 ? '0'+(startDate.getMonth()+1) : (startDate.getMonth()+1);
        let startDay = startDate.getDate().toString().length == 1 ? '0'+startDate.getDate() : startDate.getDate();
        let startHour = startDate.getHours().toString().length == 1 ? '0'+startDate.getHours() : startDate.getHours();
        let startMinutes = startDate.getMinutes().toString().length == 1 ? '0'+startDate.getMinutes() : startDate.getMinutes();

        this.startDateOnly = startYear + "-" + startMonth + "-" + startDay;
        this.startTimeOnly = startHour + ":" + startMinutes;

        let endYear = endDate.getFullYear();
        let endMonth = (endDate.getMonth()+1).toString().length == 1 ? '0'+(endDate.getMonth()+1) : (endDate.getMonth()+1);
        let endDay = endDate.getDate().toString().length == 1 ? '0'+endDate.getDate() : endDate.getDate();
        let endHour = endDate.getHours().toString().length == 1 ? '0'+endDate.getHours() : endDate.getHours();
        let endMinutes = endDate.getMinutes().toString().length == 1 ? '0'+endDate.getMinutes() : endDate.getMinutes();

        this.endDateOnly = endYear + "-" + endMonth + "-" + endDay;
        this.endTimeOnly = endHour + ":" + endMinutes;
    }

    public setDefaultStartAndEndTimesForParty(){
        // "startDateOnly":"2017-01-01","startTimeOnly":"13:00"
        let today: Date = new Date();
        let startYear = today.getFullYear();
        let startMonth = (today.getMonth()+1).toString().length == 1 ? '0'+(today.getMonth()+1) : (today.getMonth()+1);
        let startDay = today.getDate().toString().length == 1 ? '0'+today.getDate() : today.getDate();
        // Start time should be 9:30 PM
        let startHour = "21";
        let startMinutes = "30";

        let tomorrow: Date = new Date();
        tomorrow.setDate(today.getDate() + 1);
        let endYear = tomorrow.getFullYear();
        let endMonth = (tomorrow.getMonth()+1).toString().length == 1 ? '0'+(tomorrow.getMonth()+1) : (tomorrow.getMonth()+1);
        let endDay = tomorrow.getDate().toString().length == 1 ? '0'+tomorrow.getDate() : tomorrow.getDate();
        // End time should be 2:00 AM the next day
        let endHour = "02";
        let endMinutes = "00";

        this.startDateOnly = startYear + "-" + startMonth + "-" + startDay;
        this.startTimeOnly = startHour + ":" + startMinutes;
        this.endDateOnly = endYear + "-" + endMonth + "-" + endDay;
        this.endTimeOnly = endHour + ":" + endMinutes;
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