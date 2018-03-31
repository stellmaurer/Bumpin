/*******************************************************
 * Copyright (C) 2018 Stephen Ellmaurer <stellmaurer@gmail.com>
 * 
 * This file is part of the Bumpin mobile app project.
 * 
 * The Bumpin project and any of the files within the Bumpin
 * project can not be copied and/or distributed without
 * the express permission of Stephen Ellmaurer.
 *******************************************************/

import { Utility } from "./utility";

export class Bar {
    public key: string;
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
    public timeZone : number;
    public attendeesMapCleanUpHourInZulu : number;

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
        this.key = "";
        this.address = "";
        this.attendees = new Map<string,Attendee>();
        this.barID = "New Bar";
        this.details = "";
        this.hosts = new Map<string,Host>();
        this.keysInHostsMap = Array.from(this.hosts.keys());
        this.latitude = -1000;
        this.longitude = -1000;
        this.name = "";
        this.phoneNumber = "";
        this.initializeSchedule();
        this.timeZone = 0; // not worrying about this now (only matters if the person who creates the bar is in a time zone much different than the time zone of the bar)
        this.setAttendeesMapCleanUpHourInZulu();
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

    public createShallowCopy() : Bar{
        let copy : Bar = new Bar();
        copy.key = this.key;
        copy.address = this.address;
        copy.barID = this.barID;
        copy.details = this.details;
        copy.hosts = this.createCopyOfHostsMap();
        copy.latitude = this.latitude;
        copy.longitude = this.longitude;
        copy.name = this.name;
        copy.phoneNumber = this.phoneNumber;
        copy.schedule = this.createCopyOfScheduleMap();
        copy.timeZone = this.timeZone;
        copy.attendeesMapCleanUpHourInZulu = this.attendeesMapCleanUpHourInZulu;
        return copy;
    }

    private createCopyOfHostsMap() : Map<string,Host> {
        let hostsCopy = new Map<string,Host>();
        this.hosts.forEach((value: any, key: string) => {
            hostsCopy.set(key,value);
        });
        return hostsCopy;
    }

    private createCopyOfScheduleMap() : Map<string,Schedule> {
        let scheduleCopy = new Map<string,Schedule>();
        this.schedule.forEach((value: any, key: string) => {
            scheduleCopy.set(key, new Schedule(value.lastCall, value.open));
        });
        return scheduleCopy;
    }

    private initializeSchedule(){
        this.schedule = new Map<string,Schedule>();
        let defaultLastCallTime = "1:45 AM";
        let defaultOpenTime = "11 AM - 2 AM";
        this.schedule.set("Monday", new Schedule(defaultLastCallTime, defaultOpenTime));
        this.schedule.set("Tuesday", new Schedule(defaultLastCallTime, defaultOpenTime));
        this.schedule.set("Wednesday", new Schedule(defaultLastCallTime, defaultOpenTime));
        this.schedule.set("Thursday", new Schedule(defaultLastCallTime, defaultOpenTime));
        this.schedule.set("Friday", new Schedule(defaultLastCallTime, defaultOpenTime));
        this.schedule.set("Saturday", new Schedule(defaultLastCallTime, defaultOpenTime));
        this.schedule.set("Sunday", new Schedule(defaultLastCallTime, defaultOpenTime));
    }

    public prepareBarObjectForTheUI(){
        this.refreshBarStats();
    }

    private setAttendeesMapCleanUpHourInZulu(){
        let sevenAM : Date = (new Date());
        sevenAM.setHours(7);
        this.attendeesMapCleanUpHourInZulu = sevenAM.getUTCHours();
    }

    public fixMaps(){
        let fixedHostsMap = new Map<string,Host>();
        let fixedAttendeesMap = new Map<string,Attendee>();
        let fixedSchedulesMap = new Map<string,Schedule>();

        let hosts = this.hosts;
        Object.keys(hosts).forEach(function (key) {
            fixedHostsMap.set(key, hosts[key]);
        });
        this.hosts = fixedHostsMap;

        if(this.attendees != null){
            let attendees = this.attendees;
            Object.keys(attendees).forEach(function (key) {
                fixedAttendeesMap.set(key, attendees[key]);
            });
        }
        this.attendees = fixedAttendeesMap;

        let schedules = this.schedule;
        Object.keys(schedules).forEach(function (key) {
            fixedSchedulesMap.set(key, schedules[key]);
        });
        this.schedule = fixedSchedulesMap;

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
            this.averageRating = "Weak";
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
    constructor(lastCall : string, open : string) {
        this.lastCall = lastCall;
        this.open = open;
    }
}