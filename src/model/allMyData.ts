import { Bar, Attendee } from './bar';
import { Party } from './party';
import { Person } from './person';
import { Query } from "./query";
import { Http } from '@angular/http';
import { Component } from '@angular/core';
import { Events } from 'ionic-angular';
import { Utility } from "./utility";

// This class only gets created once and it happens when the app launches.
//      Person is equal to your Person object in the database. It is used
//          to make new queries to the database because it contains keys (IDs)
//          to the parties you're invited to, and the parties and bars you're
//          hosting.
//      The rest of the data (barHostFor, invitedTo, and partyHostFor) contains
//          the actual Party and Bar objects, not just the keys to them.
export class AllMyData{
    public me : Person;
    public partyHostFor : Party[];
    public barHostFor : Bar[];
    public invitedTo : Party[];
    public barsCloseToMe : Bar[];
    public thePartyOrBarIAmAt : any;
    
    public events : Events;

    constructor() {
        this.me = new Person();
        this.partyHostFor = new Array<Party>();
        this.barHostFor = new Array<Bar>();
        this.invitedTo = new Array<Party>();
        this.barsCloseToMe = new Array<Bar>();
        this.thePartyOrBarIAmAt = null;
    }

    public startPeriodicDataRetrieval(http : Http){
        var tempThis = this;
        var id = setInterval(function(){
            tempThis.events.publish("timeToRefreshPartyAndBarData");
        }, 60000);
    }

    public loginProcedure(http : Http){
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.createOrUpdatePerson()
            .then((res) => {
                //console.log(res);
                return query.getPerson();
            })
            .then((res) => {
                resolve("All login queries succeeded.");
            })
            .catch((err) => {
                console.log(err);
                reject(err);
            });
        });
    }

    public refreshPerson(http : Http){
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.getPerson()
            .then((res) => {
                //console.log(this);
                resolve("getPerson query succeeded.");
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    public rateParty(partyID : string, facebookID : string, rating : string, timeLastRated : string, timeOfLastKnownLocation : string, http : Http){
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.rateParty(partyID, facebookID, rating, timeLastRated, timeOfLastKnownLocation)
            .then((res) => {
                resolve("rateParty query succeeded.");
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    public rateBar(barID : string, facebookID : string, isMale : boolean, name : string, rating : string, status : string, timeLastRated : string, timeOfLastKnownLocation : string, http : Http){
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.rateBar(barID, facebookID, isMale, name, rating, status, timeLastRated, timeOfLastKnownLocation)
            .then((res) => {
                resolve("rateBar query succeeded.");
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    public changeAttendanceStatusToParty(partyID : string, facebookID : string, status : string, http : Http){
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.changeAttendanceStatusToParty(partyID, facebookID, status)
            .then((res) => {
                resolve("changeAttendanceStatusToParty query succeeded.");
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    public changeAttendanceStatusToBar(barID : string, facebookID : string, atBar : boolean, isMale : boolean, name : string, rating : string, status : string, timeLastRated : string, timeOfLastKnownLocation : string, http : Http){
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.changeAttendanceStatusToBar(barID,facebookID,atBar,isMale,name,rating,status,timeLastRated,timeOfLastKnownLocation)
            .then((res) => {
                resolve("changeAttendanceStatusToBar query succeeded.");
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    public changeAtPartyStatus(party : Party, atParty : boolean, http : Http){
        let timeOfLastKnownLocation = Utility.convertDateTimeToISOFormat(new Date());
        // update internal data too
        party.invitees.get(this.me.facebookID).atParty = atParty;
        party.invitees.get(this.me.facebookID).timeOfLastKnownLocation = timeOfLastKnownLocation;
        // update external data
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.changeAtPartyStatus(party.partyID, this.me.facebookID, atParty, timeOfLastKnownLocation)
            .then((res) => {
                resolve("changeAtPartyStatus query succeeded.");
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    public changeAtBarStatus(bar : Bar, atBar : boolean, http : Http){
        let name = this.me.name;
        let facebookID = this.me.facebookID;
        let isMale = this.me.isMale;
        let rating : string = "None";
        let status : string = "None";
        let timeLastRated : string = Utility.convertDateTimeToISOFormat(new Date());
        let timeOfLastKnownLocation = timeLastRated;
        let attendee : Attendee = bar.attendees.get(this.me.facebookID);
        if(attendee != null){
            rating = attendee.rating;
            status = attendee.status;
            timeLastRated = attendee.timeLastRated;
            // update internal data
            attendee.atBar = atBar;
            attendee.timeOfLastKnownLocation = timeOfLastKnownLocation;
        }else{
            // update internal data
            let newAttendee : Attendee = new Attendee();
            newAttendee.atBar = atBar;
            newAttendee.isMale = isMale;
            newAttendee.name = name;
            newAttendee.rating = rating;
            newAttendee.timeLastRated = timeLastRated;
            newAttendee.timeOfLastKnownLocation = timeLastRated;
            bar.attendees.set(facebookID, newAttendee);
        }
        // update external data
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.changeAtBarStatus(bar.barID,facebookID,atBar,isMale,name,rating,status,timeLastRated,timeOfLastKnownLocation)
            .then((res) => {
                resolve("changeAtBarStatus query succeeded.");
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    public refreshBarsCloseToMe(coordinates : any, http : Http){
        return new Promise((resolve, reject) => {
            //console.log(coordinates);
            var query = new Query(this, http);
            query.getBarsCloseToMe(coordinates)
            .then((res) => {
                //console.log(this);
                resolve("barsCloseToMe query succeeded.");
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    public refreshParties(http : Http){
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.getParties()
            .then((res) => {
                resolve("getParties query succeeded.");
            })
            .catch((err) => {
                reject(err);
            });
        });
    }
}