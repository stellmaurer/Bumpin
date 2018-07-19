/*******************************************************
 * Copyright (C) 2018 Stephen Ellmaurer <stellmaurer@gmail.com>
 * 
 * This file is part of the Bumpin mobile app project.
 * 
 * The Bumpin project and any of the files within the Bumpin
 * project can not be copied and/or distributed without
 * the express permission of Stephen Ellmaurer.
 *******************************************************/

import { Bar, Attendee } from './bar';
import { Party, Invitee, Host } from './party';
import { Person } from './person';
import { Friend } from './friend';
import { Query } from "./query";
import { Http } from '@angular/http';
import { Events } from 'ionic-angular';
import { Utility } from "./utility";
import { Injectable, NgZone } from '@angular/core';
import { Storage } from '@ionic/storage';
import { PushNotification } from "./pushNotification";

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
    public barsCloseToMeMap : Map<string,Bar>;
    public thePartyOrBarIAmAt : any;
    public friends : Friend[];
    public notifications : PushNotification[];
    public numberOfUnseenNotifications : number;
    
    public events : Events;
    public dataRetrievalTimer : NodeJS.Timer;

    constructor(public zone: NgZone, public storage: Storage) {
        this.me = new Person();
        this.partyHostFor = new Array<Party>();
        this.barHostFor = new Array<Bar>();
        this.invitedTo = new Array<Party>();
        this.barsCloseToMe = new Array<Bar>();
        this.barsCloseToMeMap = new Map<string,Bar>();
        this.thePartyOrBarIAmAt = null;
        this.friends = new Array<Friend>();
        this.notifications = new Array<PushNotification>();
        this.numberOfUnseenNotifications = 0;
    }

    public refreshDataAndResetPeriodicDataRetrievalTimer(http : Http){
        this.events.publish("timeToRefreshPartyAndBarData");
        clearInterval(this.dataRetrievalTimer);
        this.dataRetrievalTimer = setInterval(() => {
            this.events.publish("timeToRefreshPartyAndBarData");
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
                reject(err);
            });
        });
    }

    public createOrUpdatePerson(http : Http){
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.createOrUpdatePerson()
            .then((res) => {
                return this.refreshPerson(http);
            })
            .then((res) => {
                resolve("createOrUpdatePerson query succeeded.");
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    public refreshPerson(http : Http){
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.getPerson(this.me.facebookID)
            .then((res) => {
                this.changeMyGoingOutStatusToUnknownIfStatusIsExpired();
                this.clearOutstandingNotificationCountForPerson(http);
                resolve("getPerson query succeeded.");
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    public getNotifications(http : Http){
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.getNotifications()
            .then((res) => {
                resolve("getNotifications query succeeded.");
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    public clearOutstandingNotificationCountForPerson(http : Http){
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.clearOutstandingNotificationCount()
            .then((res) => {
                resolve("clearOutstandingNotificationCountForPerson query succeeded.");
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    public markNotificationAsSeen(notification : PushNotification, http : Http){
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.markNotificationAsSeen(notification)
            .then((res) => {
                resolve("markNotificationAsSeen query succeeded.");
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    public deleteNotification(notification : PushNotification, http : Http){
        this.zone.run(() => {
            this.deleteNotificationLocally(notification);
        });
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.deleteNotification(notification)
            .then((res) => {
                resolve("deleteNotification query succeeded.");
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    private deleteNotificationLocally(notification : PushNotification){
        let indexToRemove = this.notifications.indexOf(notification);
        let notifications = new Array<PushNotification>();
        for(let i = 0; i < this.notifications.length; i++){
            if(i != indexToRemove){
                notifications.push(this.notifications[i]);
            }
        }
        this.notifications = notifications;
    }

    private changeMyGoingOutStatusToUnknownIfStatusIsExpired(){
        var goingOutStatusIsExpired = Utility.isGoingOutStatusExpired(this.me.status["timeGoingOutStatusWasSet"]);
        if(goingOutStatusIsExpired){
            this.me.status["goingOut"] = "Unknown";
        }
    }

    public rateParty(party : Party, rating : string, http : Http){
        let timeLastRated = Utility.convertDateTimeToISOFormat(new Date());
        let timeOfLastKnownLocation = timeLastRated;
        this.zone.run(() => {
            party.invitees.get(this.me.facebookID).atParty = true;
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
        
        let timeLastRated = Utility.convertDateTimeToISOFormat(new Date());
        let timeOfLastKnownLocation = timeLastRated;
        this.zone.run(() => {
            bar.attendees.get(this.me.facebookID).atBar = true;
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

    public clearRatingForParty(party : Party, http : Http){
        let timeLastRated = Utility.convertDateTimeToISOFormat(new Date());
        let timeOfLastKnownLocation = timeLastRated;
        this.zone.run(() => {
            party.invitees.get(this.me.facebookID).atParty = false;
            party.invitees.get(this.me.facebookID).rating = "None";
            party.invitees.get(this.me.facebookID).timeLastRated = timeLastRated;
            party.invitees.get(this.me.facebookID).timeOfLastKnownLocation = timeOfLastKnownLocation;
            party.refreshPartyStats();
        });
        this.events.publish("timeToUpdateUI");
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.clearRatingForParty(party.partyID, this.me.facebookID, timeLastRated, timeOfLastKnownLocation)
            .then((res) => {
                resolve("clearRatingForParty query succeeded.");
            })
            .catch((err) => {
                reject(err);
            });
        });
        
    }

    public clearRatingForBar(bar : Bar, http : Http){
        // If you're not an attendee of the bar, make yourself an attendee
        if(bar.attendees.get(this.me.facebookID) == null){
            var newAttendee = new Attendee();
            newAttendee.atBar = false;
            newAttendee.isMale = this.me.isMale;
            newAttendee.name = this.me.name;
            newAttendee.rating = "None";
            newAttendee.status = "None";
            newAttendee.timeLastRated = "2001-01-01T00:00:00Z";
            bar.attendees.set(this.me.facebookID, newAttendee);
        }
        
        let timeLastRated = Utility.convertDateTimeToISOFormat(new Date());
        let timeOfLastKnownLocation = timeLastRated;
        this.zone.run(() => {
            bar.attendees.get(this.me.facebookID).atBar = false;
            bar.attendees.get(this.me.facebookID).rating = "None";
            bar.attendees.get(this.me.facebookID).timeLastRated = timeLastRated;
            bar.attendees.get(this.me.facebookID).timeOfLastKnownLocation = timeOfLastKnownLocation;
            bar.refreshBarStats();
        });
        this.events.publish("timeToUpdateUI");
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.clearRatingForBar(bar.barID, this.me.facebookID, this.me.isMale, this.me.name, bar.attendees.get(this.me.facebookID).status, timeLastRated, timeOfLastKnownLocation)
            .then((res) => {
                resolve("clearRatingForBar query succeeded.");
            })
            .catch((err) => {
                reject(err);
            });
        });
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
            var query = new Query(this, http);
            query.getBarsCloseToMe(coordinates)
            .then((res) => {
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

    public refreshFriends(http : Http){
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.getFriends()
            .then((res) => {
                this.zone.run(() => {
                    this.changeGoingOutStatusOfFriendsToUnknownIfStatusIsExpired();
                });
                resolve("getFriends query succeeded.");
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    private changeGoingOutStatusOfFriendsToUnknownIfStatusIsExpired(){
        for(let i = 0; i < this.friends.length; i++){
            let friend = this.friends[i];
            var goingOutStatusIsExpired = Utility.isGoingOutStatusExpired(friend.status["timeGoingOutStatusWasSet"]);
            if(goingOutStatusIsExpired){
                friend.status["goingOut"] = "Unknown";
            }
        }
    }

    public changeMyGoingOutStatus(status : string, manuallySet : string, http : Http){
        let lastTimeGoingOutStatusWasSet = new Date(this.me.status["timeGoingOutStatusWasSet"]);
        let lastGoingOutStatus = this.me.status["goingOut"];
        let timeGoingOutStatusWasSet = Utility.convertDateTimeToISOFormat(new Date());
        this.zone.run(() => {
            this.me.status["goingOut"] = status;
            this.me.status["timeGoingOutStatusWasSet"] = timeGoingOutStatusWasSet;
            this.me.status["manuallySet"] = manuallySet;
        });
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.updatePersonStatus(this.me.facebookID, status, timeGoingOutStatusWasSet, manuallySet)
            .then((res) => {
                let today = new Date();

                if(lastTimeGoingOutStatusWasSet.getFullYear() == today.getFullYear() &&
                lastTimeGoingOutStatusWasSet.getMonth() == today.getMonth() && 
                lastTimeGoingOutStatusWasSet.getDate() == today.getDate()){
                    if(lastGoingOutStatus == "No" && status != "No"){
                        return this.letMyFriendsKnowThatIMightGoOutTonight(http);
                    }else if(lastGoingOutStatus != "No" && status == "No"){
                        return this.letMyFriendsKnowThatImNotGoingOutAnymore(http);
                    }else{
                        resolve("changeMyGoingOutStatus query successfully completed.");
                    }
                }else{
                    if(status == "No"){
                        resolve("changeMyGoingOutStatus query successfully completed.");
                        return;
                    }else{
                        return this.letMyFriendsKnowThatIMightGoOutTonight(http);
                    }
                }
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    public letMyFriendsKnowThatIMightGoOutTonight(http : Http){
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.letMyFriendsKnowThatIMightGoOutTonight()
            .then((res) => {
                resolve("letMyFriendsKnowThatIMightGoOutTonight query succeeded.");
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    public letMyFriendsKnowThatImNotGoingOutAnymore(http : Http){
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.letMyFriendsKnowThatImNotGoingOutAnymore()
            .then((res) => {
                resolve("letMyFriendsKnowThatImNotGoingOutAnymore query succeeded.");
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    public sendInvitationsAsGuestOfParty(party : Party, inviteesToAdd : Map<string,Invitee>, http : Http){
        return new Promise((resolve, reject) => {
            var query = new Query(this, http);
            query.sendInvitationsAsGuestOfParty(party, inviteesToAdd)
            .then((res) => {
                this.zone.run(() => {
                    inviteesToAdd.forEach((value: any, key: string) => {
                        party.invitees.set(key, value);
                    });
                });
                resolve("sendInvitationsAsGuestOfParty query succeeded.");
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