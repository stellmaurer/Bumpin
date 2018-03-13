import { Bar, Attendee } from './bar';
import { Party, Invitee, Host } from './party';
import { Person } from './person';
import { Friend } from './friend';
import { Query } from "./query";
import { Http } from '@angular/http';
import { Component } from '@angular/core';
import { Events } from 'ionic-angular';
import { Utility } from "./utility";
import { Injectable, NgZone } from '@angular/core';

// This class only gets created once and it happens when the app launches.
//      Person is equal to your Person object in the database. It is used
//          to make new queries to the database because it contains keys (IDs)
//          to the parties you're invited to, and the parties and bars you're
//          hosting.
//      The rest of the data (barHostFor, invitedTo, and partyHostFor) contains
//          the actual Party and Bar objects, not just the keys to them.
@Injectable()
export class AllMyData{
    public me : Person;
    public partyHostFor : Party[];
    public barHostFor : Bar[];
    public invitedTo : Party[];
    public barsCloseToMe : Bar[];
    public thePartyOrBarIAmAt : any;
    public friends : Friend[];
    
    public events : Events;

    constructor(public zone: NgZone) {
        this.me = new Person();
        this.partyHostFor = new Array<Party>();
        this.barHostFor = new Array<Bar>();
        this.invitedTo = new Array<Party>();
        this.barsCloseToMe = new Array<Bar>();
        this.thePartyOrBarIAmAt = null;
        this.friends = new Array<Friend>();
    }

    public startPeriodicDataRetrieval(http : Http){
        var tempThis = this;
        var id = setInterval(function(){
            tempThis.events.publish("timeToRefreshPartyAndBarData");
        }, 60000);
    }

    public refreshMyDataFromFacebook(accessToken : string, http : Http){
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.refreshMyDataFromFacebook(accessToken)
            .then((res) => {
                resolve("AllMyData class: refreshMyDataFromFacebook query succeeded.");
            })
            .catch((err) => {
                console.log("AllMyData class: error in refreshMyDataFromFacebook.");
                reject(err);
            });
        });
    }

    public createOrUpdatePerson(http : Http){
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.createOrUpdatePerson(this.me.facebookID, this.me.isMale, this.me.name)
            .then((res) => {
                //console.log(res);
                return query.getPerson(this.me.facebookID);
            })
            .then((res) => {
                resolve("CreateUpdateMeInDatabase query succeeded.");
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
            query.getPerson(this.me.facebookID)
            .then((res) => {
                //console.log(this);
                resolve("getPerson query succeeded.");
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    public rateParty(party : Party, rating : string, http : Http){
        if(rating != party.invitees.get(this.me.facebookID).rating){
            let timeLastRated = Utility.convertDateTimeToISOFormat(new Date());
            let timeOfLastKnownLocation = timeLastRated;
            this.zone.run(() => {
                party.invitees.get(this.me.facebookID).rating = rating;
                party.invitees.get(this.me.facebookID).timeLastRated = timeLastRated;
                party.invitees.get(this.me.facebookID).timeOfLastKnownLocation = timeOfLastKnownLocation;
                party.refreshPartyStats();
            });
            this.events.publish("timeToUpdateUI");
            return new Promise((resolve, reject) => {
                var query = new Query(this, http);
                query.rateParty(party.partyID, this.me.facebookID, rating, timeLastRated, timeOfLastKnownLocation)
                .then((res) => {
                    resolve("rateParty query succeeded.");
                })
                .catch((err) => {
                    reject(err);
                });
            });
        }
    }

    public rateBar(bar : Bar, rating : string, http : Http){
        
        // If you're not an attendee of the bar, make yourself an attendee
        if(bar.attendees.get(this.me.facebookID) == null){
            var newAttendee = new Attendee();
            newAttendee.atBar = true;
            newAttendee.isMale = this.me.isMale;
            newAttendee.name = this.me.name;
            newAttendee.rating = "None";
            newAttendee.status = "None";
            newAttendee.timeLastRated = "2001-01-01T00:00:00Z";
            bar.attendees.set(this.me.facebookID, newAttendee);
        }

        if(rating != bar.attendees.get(this.me.facebookID).rating){
            let timeLastRated = Utility.convertDateTimeToISOFormat(new Date());
            let timeOfLastKnownLocation = timeLastRated;
            this.zone.run(() => {
                bar.attendees.get(this.me.facebookID).rating = rating;
                bar.attendees.get(this.me.facebookID).timeLastRated = timeLastRated;
                bar.attendees.get(this.me.facebookID).timeOfLastKnownLocation = timeOfLastKnownLocation;
                bar.refreshBarStats();
            });
            this.events.publish("timeToUpdateUI");
            return new Promise((resolve, reject) => {
                var query = new Query(this, http);
                query.rateBar(bar.barID, this.me.facebookID, this.me.isMale, this.me.name, rating, bar.attendees.get(this.me.facebookID).status, timeLastRated, timeOfLastKnownLocation)
                .then((res) => {
                    resolve("rateBar query succeeded.");
                })
                .catch((err) => {
                    reject(err);
                });
            });
        }
    }

    public changeAttendanceStatusToParty(party : Party, status : string, http : Http){
        if(status != party.invitees.get(this.me.facebookID).status){
            this.zone.run(() => {
                party.invitees.get(this.me.facebookID).status = status;
                party.refreshPartyStats();
            });
            return new Promise((resolve, reject) => {
                var query = new Query(this, http);
                query.changeAttendanceStatusToParty(party.partyID, this.me.facebookID, status)
                .then((res) => {
                    resolve("changeAttendanceStatusToParty query succeeded.");
                })
                .catch((err) => {
                    reject(err);
                });
            });
        }
    }

    public changeAttendanceStatusToBar(bar : Bar, status : string, http : Http){
        this.zone.run(() => {
            if(bar.attendees.get(this.me.facebookID) != null){
                if(status != bar.attendees.get(this.me.facebookID).status){
                    bar.attendees.get(this.me.facebookID).status = status;
                }
            }else{
                var newAttendee = new Attendee();
                newAttendee.atBar = false;
                newAttendee.isMale = this.me.isMale;
                newAttendee.name = this.me.name;
                newAttendee.rating = "None";
                newAttendee.status = status;
                newAttendee.timeLastRated = "2001-01-01T00:00:00Z";
                newAttendee.timeOfLastKnownLocation = "2001-01-01T00:00:00Z";
                bar.attendees.set(this.me.facebookID, newAttendee);
            }
            bar.refreshBarStats();
        });
        let me = bar.attendees.get(this.me.facebookID);
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.changeAttendanceStatusToBar(bar.barID, this.me.facebookID, me.atBar, me.isMale, me.name, me.rating, me.status, me.timeLastRated, me.timeOfLastKnownLocation)
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
        this.zone.run(() => {
            party.invitees.get(this.me.facebookID).atParty = atParty;
            party.invitees.get(this.me.facebookID).timeOfLastKnownLocation = timeOfLastKnownLocation;
            party.refreshPartyStats();
        });
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
            this.zone.run(() => {
                attendee.atBar = atBar;
                attendee.timeOfLastKnownLocation = timeOfLastKnownLocation;
                bar.refreshBarStats();
            });
        }else{
            // update internal data
            let newAttendee : Attendee = new Attendee();
            newAttendee.atBar = atBar;
            newAttendee.isMale = isMale;
            newAttendee.name = name;
            newAttendee.rating = rating;
            newAttendee.status = status;
            newAttendee.timeLastRated = timeLastRated;
            newAttendee.timeOfLastKnownLocation = timeLastRated;
            this.zone.run(() => {
                bar.attendees.set(facebookID, newAttendee);
                bar.refreshBarStats();
            });
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

    public acceptInvitationToHostParty(party : Party, http : Http){
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.acceptInvitationToHostParty(party)
            .then((res) => {
                resolve("acceptInvitationToHostParty query succeeded.");
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    public declineInvitationToHostParty(party : Party, http : Http){
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.declineInvitationToHostParty(party)
            .then((res) => {
                resolve("declineInvitationToHostParty query succeeded.");
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    public acceptInvitationToHostBar(bar : Bar, http : Http){
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.acceptInvitationToHostBar(bar)
            .then((res) => {
                resolve("acceptInvitationToHostBar query succeeded.");
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    public declineInvitationToHostBar(bar : Bar, http : Http){
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.declineInvitationToHostBar(bar)
            .then((res) => {
                resolve("declineInvitationToHostBar query succeeded.");
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    public removeYourselfAsHostForParty(party : Party, http : Http){
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.removeYourselfAsHostForParty(party)
            .then((res) => {
                resolve("removeYourselfAsHostForParty query succeeded.");
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    public removeYourselfAsHostForBar(bar : Bar, http : Http){
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.removeYourselfAsHostForBar(bar)
            .then((res) => {
                resolve("removeYourselfAsHostForBar query succeeded.");
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
            query.getPartiesImInvitedTo()
            .then((res) => {
                resolve("getPartiesImInvitedTo query succeeded.");
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    public createParty(party : Party, http : Http){
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.createParty(party)
            .then((res) => {
                resolve("createParty query succeeded.");
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    public editParty(party : Party, inviteesToAdd : Map<string,Invitee>, inviteesToRemove : Map<string,Invitee>, hostsToAdd : Map<string,Host>, hostsToRemove : Map<string,Host>, http : Http){
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.editParty(party, inviteesToAdd, inviteesToRemove, hostsToAdd, hostsToRemove)
            .then((res) => {
                resolve("editParty query succeeded.");
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    public deleteParty(party : Party, http : Http){
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.deleteParty(party)
            .then((res) => {
                resolve("deleteParty query succeeded.");
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    public refreshPartiesImHosting(http : Http){
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            this.zone.run(() => {
                query.getPartiesImHosting()
                .then((res) => {
                    resolve("getPartiesImHosting query succeeded.");
                })
                .catch((err) => {
                    reject(err);
                });
            });
        });
    }

    public refreshBarsImHosting(http : Http){
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            this.zone.run(() => {
                query.getBarsImHosting()
                .then((res) => {
                    resolve("getBarsImHosting query succeeded.");
                })
                .catch((err) => {
                    reject(err);
                });
            });
        });
    }

    public getAddressForBarKey(bar: Bar, http: Http){
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.getAddressForBarKey(bar)
            .then((res : any) => {
                this.zone.run(() => {
                    bar.address = res.error;
                });
                resolve("getBarKey query succeeded.");
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    public createBar(bar : Bar, http : Http){
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.createBar(bar)
            .then((res) => {
                resolve("createBar query succeeded.");
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    public editBar(bar : Bar, hostsToAdd : Map<string,Host>, hostsToRemove : Map<string,Host>, http : Http){
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.editBar(bar, hostsToAdd, hostsToRemove)
            .then((res) => {
                resolve("editBar query succeeded.");
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    public deleteBar(bar : Bar, http : Http){
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.deleteBar(bar)
            .then((res) => {
                resolve("deleteBar query succeeded.");
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    public createBug(description: string, http : Http){
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.createBug(this.me.facebookID, description)
            .then((res) => {
                resolve("createBug query succeeded.");
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    public createFeatureRequest(description: string, http : Http){
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.createFeatureRequest(this.me.facebookID, description)
            .then((res) => {
                resolve("createFeatureRequest query succeeded.");
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    private logErrorHelper(pageName : string, errorType : string, errorDescription: string, http : Http){
        errorDescription += " | FB ID = " + this.me.facebookID;
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.logError(pageName, errorType, errorDescription)
            .then((res) => {
                resolve("logError query succeeded.");
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    public logError(pageName : string, errorType : string, errorDescription : string, http : Http){
        this.logErrorHelper(pageName, errorType, errorDescription, http)
        .then((res) => {
          
        })
        .catch((err) => {
          console.log(err);
        });
      }
}