/*******************************************************
 * Copyright (C) 2018 Stephen Ellmaurer <stellmaurer@gmail.com>
 * 
 * This file is part of the Bumpin mobile app project.
 * 
 * The Bumpin project and any of the files within the Bumpin
 * project can not be copied and/or distributed without
 * the express permission of Stephen Ellmaurer.
 *******************************************************/

import { Bar } from './bar';
import { Party, Invitee, Host } from './party';
import { Person } from './person';
import { Friend } from './friend';
import { AllMyData } from './allMyData';
import { Http, Headers, RequestOptions } from '@angular/http';
import { deserialize } from "serializer.ts/Serializer";
import { Utility } from "./utility";
import { PushNotification } from "./pushNotification";

export class Query{
    constructor(private allMyData : AllMyData, private http : Http){
      
    }

    // curl "https://graph.facebook.com/me?fields=id,name,gender,friends&access_token=EAAGqhN2UkfwBACXGfqebyJ9LxCVXOBuPSyR9eVExRD0PZA3TBIOHJtXUjLXRaL2TPsGrFr5BXPkJw8ttKP3aejbdfPVoxCSmyMzjmlTD4BNn6Y7Gxz0cfig3aJZC6HOnLGQcId0MwFOWEjmQYnt5r01hVjpUiNSrpDEzZAODYVyzS0NEHKNZC5BKU0xh6yVa8ioQcT0rTmEYqxJ61WsX"
    public refreshMyDataFromFacebook(accessToken : string){
        return new Promise((resolve, reject) => {
            var url = "https://graph.facebook.com/me?fields=id,name,gender,friends{id,name,gender}&access_token=" + accessToken;
            this.http.get(url).map(res => res.json()).subscribe(data => {
                // TODO: Might need to eventually check for an error here.
                this.createMyFriendList(data);
                this.allMyData.me.facebookID = data.id;
                if(data.gender == "male"){
                    this.allMyData.me.isMale = true;
                }else{
                    this.allMyData.me.isMale = false;
                }
                this.allMyData.me.name = data.name;
                resolve(data);
            });
        });
    }

    private createMyFriendList(data : any)
    {
        this.allMyData.friends = new Array<Friend>();
        for(let i = 0; i < data.friends.data.length; i++){
            var friend : Friend = new Friend();
            friend.facebookID = data.friends.data[i].id;
            friend.name = data.friends.data[i].name;
            if(data.friends.data[i].gender == "male"){
                friend.isMale = true;
            }else{
                friend.isMale = false;
            }
            this.allMyData.friends.push(friend);
            //console.log("Friend added: FacebookID=" + friend.facebookID + ", Name= " + friend.name + ", Male=" + friend.isMale);
        }

        if(data.friends.paging.next != undefined){
            this.pageThroughMoreFriends(data.friends.paging.next)
            .then((res) => {
                this.sortFacebookFriendsByName();
            })
            .catch((err) => {
                this.allMyData.logError("More Tab", "login", "error while paging through user's FB friends : Err msg = " + err, this.http);
            });
        }else{
            this.sortFacebookFriendsByName();
        }

        
    }

    private pageThroughMoreFriends(url : string){
        return new Promise((resolve, reject) => {
            this.http.get(url).map(res => res.json()).subscribe(data => {
                // TODO: Might need to eventually check for an error here.
                for(let i = 0; i < data.data.length; i++){
                    var friend : Friend = new Friend();
                    friend.facebookID = data.data[i].id;
                    friend.name = data.data[i].name;
                    if(data.data[i].gender == "male"){
                        friend.isMale = true;
                    }else{
                        friend.isMale = false;
                    }
                    this.allMyData.friends.push(friend);
                }
        
                if(data.paging.next != undefined){
                    return this.pageThroughMoreFriends(data.paging.next);
                }
                resolve("Successfully paged through the user's Facebook friends.");
            });
        });
    }

    private sortFacebookFriendsByName(){
        this.allMyData.friends.sort(function(a, b){
            if(b.name < a.name){
                return 1;
            }
            if(b.name > a.name){
                return -1;
            }
            return 0;
        });
    }
    
    public getPerson(facebookID : string){
        return new Promise((resolve, reject) => {
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/getPerson?facebookID=" + facebookID;
            this.http.get(url).map(res => res.json()).subscribe(data => {
                if(data.succeeded){
                    this.allMyData.me = deserialize<Person>(Person, data.people[0]);
                    resolve(data);
                }else{
                    reject(data.error);
                }
            });
        });
    }

    // curl http://localhost:5000/getNotificationsForPerson -d "facebookID=10154326505409816"
    public getNotifications(){
        return new Promise((resolve, reject) => {
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/getNotificationsForPerson";
            let body = "facebookID=" + this.allMyData.me.facebookID;
            var headers = new Headers();
            headers.append('content-type', "application/x-www-form-urlencoded");
            let options= new RequestOptions({headers: headers});
            this.http.post(url, body, options).map(res => res.json()).subscribe(data => {
                if(data.succeeded){
                    this.allMyData.notifications = deserialize<PushNotification[]>(PushNotification, data.notifications);
                    this.allMyData.notifications.sort(function(a, b){
                        if(b.expiresAt > a.expiresAt){
                            return 1;
                        }
                        if(b.expiresAt < a.expiresAt){
                            return -1;
                        }
                        return 0;
                    });
                    this.allMyData.numberOfUnseenNotifications = 0;
                    for(let i = 0; i < this.allMyData.notifications.length; i++){
                        if(this.allMyData.notifications[i].hasBeenSeen == false){
                            this.allMyData.numberOfUnseenNotifications++;
                        }
                    }
                    resolve(data);
                }else{
                    reject(data.error);
                }
            });
        });
    }

    // curl http://localhost:5000/markNotificationAsSeen -d "notificationID=7816555614368222646"
    public markNotificationAsSeen(notification : PushNotification){
        return new Promise((resolve, reject) => {
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/markNotificationAsSeen";
            let body = "notificationID=" + notification.notificationID;
            var headers = new Headers();
            headers.append('content-type', "application/x-www-form-urlencoded");
            let options= new RequestOptions({headers: headers});
            this.http.post(url, body, options).map(res => res.json()).subscribe(data => {
                if(data.succeeded){
                    resolve(data);
                }else{
                    reject(data.error);
                }
            });
        });
    }
    
    public createOrUpdatePerson(){
        return new Promise((resolve, reject) => {
            Promise.all([this.allMyData.storage.get('platform'), this.allMyData.storage.get('deviceToken')]).then(data => {
                let platform = data[0];
                let deviceToken = data[1];
                var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/createOrUpdatePerson";
                let body = "facebookID=" + this.allMyData.me.facebookID + "&isMale=" + this.allMyData.me.isMale + 
                            "&name=" + encodeURIComponent(this.allMyData.me.name) + "&platform=" + platform +
                            "&deviceToken=" + encodeURIComponent(deviceToken);
                var headers = new Headers();
                headers.append('content-type', "application/x-www-form-urlencoded");
                let options= new RequestOptions({headers: headers});
                this.http.post(url, body, options).map(res => res.json()).subscribe(data => {
                    if(data.succeeded){
                        resolve(data);
                    }else{
                        reject(data.error);
                    }
                });
              })
              .catch((err) => {
                reject(err);
              });
        });
    }

    // curl http://bumpin-env.us-west-2.elasticbeanstalk.com:80/rateParty -d "partyID=10583166241324703384&facebookID=10155613117039816&rating=Heating%20Up&timeLastRated=2017-03-04T00:57:00Z&timeOfLastKnownLocation=2017-03-04T01:25:00Z"
    public rateParty(partyID : string, facebookID : string, rating : string, timeLastRated : string, timeOfLastKnownLocation : string){
        return new Promise((resolve, reject) => {
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/rateParty";
            let body = "partyID=" + partyID + "&facebookID=" + facebookID + "&rating=" + encodeURIComponent(rating) + "&timeLastRated=" + timeLastRated + "&timeOfLastKnownLocation=" + timeOfLastKnownLocation;
            var headers = new Headers();
            headers.append('content-type', "application/x-www-form-urlencoded");
            let options= new RequestOptions({headers: headers});
            this.http.post(url, body, options).map(res => res.json()).subscribe(data => {
                if(data.succeeded){
                    resolve(data);
                }else{
                    reject(data.error);
                }
            });
        });
    }

    // curl http://bumpin-env.us-west-2.elasticbeanstalk.com:80/rateBar -d "barID=5272501342297530080&facebookID=370&isMale=true&name=Steve&rating=Heating%20Up&status=Going&timeLastRated=2017-03-04T01:25:00Z&timeOfLastKnownLocation=2017-03-04T01:25:00Z"
    public rateBar(barID : string, facebookID : string, isMale : boolean, name : string, rating : string, status : string, timeLastRated : string, timeOfLastKnownLocation : string){
        return new Promise((resolve, reject) => {
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/rateBar";
            let body = "barID=" + barID + "&facebookID=" + facebookID + "&isMale=" + isMale + "&name=" + name + "&rating=" + encodeURIComponent(rating) + "&status=" + status + "&timeLastRated=" + timeLastRated + "&timeOfLastKnownLocation=" + timeOfLastKnownLocation;
            var headers = new Headers();
            headers.append('content-type', "application/x-www-form-urlencoded");
            let options= new RequestOptions({headers: headers});
            this.http.post(url, body, options).map(res => res.json()).subscribe(data => {
                if(data.succeeded){
                    resolve(data);
                }else{
                    reject(data.error);
                }
            });
        });
    }

    // curl http://bumpin-env.us-west-2.elasticbeanstalk.com:80/changeAtPartyStatus -d "partyID=10583166241324703384&facebookID=10155613117039816&atParty=true"
    public changeAttendanceStatusToParty(partyID : string, facebookID : string, status : string){
        return new Promise((resolve, reject) => {
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/changeAttendanceStatusToParty";
            let body = "partyID=" + partyID + "&facebookID=" + facebookID + "&status=" + status;
            var headers = new Headers();
            headers.append('content-type', "application/x-www-form-urlencoded");
            let options= new RequestOptions({headers: headers});
            this.http.post(url, body, options).map(res => res.json()).subscribe(data => {
                if(data.succeeded){
                    resolve(data);
                }else{
                    reject(data.error);
                }
            });
        });
    }

    // curl http://bumpin-env.us-west-2.elasticbeanstalk.com:80/changeAttendanceStatusToBar -d "barID=5272501342297530080&facebookID=9321&atBar=false&isMale=false&name=Emily%20Blunt&rating=None&status=Maybe&timeLastRated=2001-01-01T00:00:00Z&timeOfLastKnownLocation=2001-01-01T00:00:00Z"
    public changeAttendanceStatusToBar(barID : string, facebookID : string, atBar : boolean, isMale : boolean, name : string, rating : string, status : string, timeLastRated : string, timeOfLastKnownLocation : string){
        return new Promise((resolve, reject) => {
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/changeAttendanceStatusToBar";
            let body = "barID=" + barID + "&facebookID=" + facebookID + "&atBar=" + atBar + "&isMale=" + isMale + "&name=" + name + "&rating=" + rating + "&status=" + status + "&timeLastRated=" + timeLastRated + "&timeOfLastKnownLocation=" + timeOfLastKnownLocation;
            var headers = new Headers();
            headers.append('content-type', "application/x-www-form-urlencoded");
            let options= new RequestOptions({headers: headers});
            this.http.post(url, body, options).map(res => res.json()).subscribe(data => {
                if(data.succeeded){
                    resolve(data);
                }else{
                    reject(data.error);
                }
            });
        });
    }

    // curl http://localhost:5000/updatePersonStatus -d "facebookID=&goingOut=Unknown&timeGoingOutStatusWasSet=2000-01-01T00:00:00Z&manuallySet=No"
    public updatePersonStatus(facebookID : string, status : string, timeGoingOutStatusWasSet : string, manuallySet : string){
        return new Promise((resolve, reject) => {
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/updatePersonStatus";
            let body = "facebookID=" + facebookID + "&goingOut=" + encodeURIComponent(status) + "&timeGoingOutStatusWasSet=" + timeGoingOutStatusWasSet + "&manuallySet=" + manuallySet;
            var headers = new Headers();
            headers.append('content-type', "application/x-www-form-urlencoded");
            let options= new RequestOptions({headers: headers});
            this.http.post(url, body, options).map(res => res.json()).subscribe(data => {
                if(data.succeeded){
                    resolve(data);
                }else{
                    reject(data.error);
                }
            });
        });
    }

    // curl http://bumpin-env.us-west-2.elasticbeanstalk.com:80/changeAtPartyStatus -d "partyID=3005619273277206682&facebookID=10155613117039816&atParty=true&timeOfLastKnownLocation=2017-09-04T00:00:00Z"
    public changeAtPartyStatus(partyID : string, facebookID : string, atParty : boolean, timeOfLastKnownLocation : string){
        return new Promise((resolve, reject) => {
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/changeAtPartyStatus";
            let body = "partyID=" + partyID + "&facebookID=" + facebookID + "&atParty=" + atParty + "&timeOfLastKnownLocation=" + timeOfLastKnownLocation;
            var headers = new Headers();
            headers.append('content-type', "application/x-www-form-urlencoded");
            let options= new RequestOptions({headers: headers});
            this.http.post(url, body, options).map(res => res.json()).subscribe(data => {
                if(data.succeeded){
                    resolve(data);
                }else{
                    reject(data.error);
                }
            });
        });
    }

    // curl http://bumpin-env.us-west-2.elasticbeanstalk.com:80/changeAtBarStatus -d "barID=3269697223881195499&facebookID=010101&atBar=true&isMale=true&name=Gerrard%20Holler&rating=None&status=Maybe&timeLastRated=2000-01-01T00:00:00Z&timeOfLastKnownLocation=2017-09-04T00:00:00Z"
    public changeAtBarStatus(barID : string, facebookID : string, atBar : boolean, isMale : boolean, name : string, rating : string, status : string, timeLastRated : string, timeOfLastKnownLocation : string){
        return new Promise((resolve, reject) => {
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/changeAtBarStatus";
            let body = "barID=" + barID + "&facebookID=" + facebookID + "&atBar=" + atBar + "&isMale=" + isMale + "&name=" + name + "&rating=" + rating + "&status=" + status + "&timeLastRated=" + timeLastRated + "&timeOfLastKnownLocation=" + timeOfLastKnownLocation;
            var headers = new Headers();
            headers.append('content-type', "application/x-www-form-urlencoded");
            let options= new RequestOptions({headers: headers});
            this.http.post(url, body, options).map(res => res.json()).subscribe(data => {
                if(data.succeeded){
                    resolve(data);
                }else{
                    reject(data.error);
                }
            });
        });
    }

    // curl http://bumpin-env.us-west-2.elasticbeanstalk.com:80/acceptInvitationToHostParty -d "partyID=2507077996928339051&facebookID=113057999456597&isMale=false&name=Ruth%20Sidhuson"
    public acceptInvitationToHostParty(party: Party){
        return new Promise((resolve, reject) => {
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/acceptInvitationToHostParty";
            let body = "partyID=" + party.partyID +
                       "&facebookID=" + this.allMyData.me.facebookID +
                       "&isMale=" + this.allMyData.me.isMale +
                       "&name=" + encodeURIComponent(this.allMyData.me.name);
            var headers = new Headers();
            headers.append('content-type', "application/x-www-form-urlencoded");
            let options= new RequestOptions({headers: headers});
            this.http.post(url, body, options).map(res => res.json()).subscribe(data => {
                if(data.succeeded){
                    resolve(data);
                }else{
                    reject(data.error);
                }
            });
        });
    }

    // curl http://localhost:5000/declineInvitationToHostParty -d "partyID=1&facebookID=90"
    public declineInvitationToHostParty(party: Party){
        return new Promise((resolve, reject) => {
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/declineInvitationToHostParty";
            let body = "partyID=" + party.partyID +
                       "&facebookID=" + this.allMyData.me.facebookID;
            var headers = new Headers();
            headers.append('content-type', "application/x-www-form-urlencoded");
            let options= new RequestOptions({headers: headers});
            this.http.post(url, body, options).map(res => res.json()).subscribe(data => {
                if(data.succeeded){
                    resolve(data);
                }else{
                    reject(data.error);
                }
            });
        });
    }

    // curl http://bumpin-env.us-west-2.elasticbeanstalk.com:80/acceptInvitationToHostBar -d "barID=1&facebookID=1"
    public acceptInvitationToHostBar(bar: Bar){
        return new Promise((resolve, reject) => {
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/acceptInvitationToHostBar";
            let body = "barID=" + bar.barID +
                       "&facebookID=" + this.allMyData.me.facebookID;
            var headers = new Headers();
            headers.append('content-type', "application/x-www-form-urlencoded");
            let options= new RequestOptions({headers: headers});
            this.http.post(url, body, options).map(res => res.json()).subscribe(data => {
                if(data.succeeded){
                    resolve(data);
                }else{
                    reject(data.error);
                }
            });
        });
    }

    // curl http://localhost:5000/declineInvitationToHostBar -d "barID=1&facebookID=90"
    public declineInvitationToHostBar(bar: Bar){
        return new Promise((resolve, reject) => {
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/declineInvitationToHostBar";
            let body = "barID=" + bar.barID +
                       "&facebookID=" + this.allMyData.me.facebookID;
            var headers = new Headers();
            headers.append('content-type', "application/x-www-form-urlencoded");
            let options= new RequestOptions({headers: headers});
            this.http.post(url, body, options).map(res => res.json()).subscribe(data => {
                if(data.succeeded){
                    resolve(data);
                }else{
                    reject(data.error);
                }
            });
        });
    }

    // curl http://localhost:5000/removePartyHost -d "partyID=1&facebookID=90"
    public removeYourselfAsHostForParty(party: Party){
        return new Promise((resolve, reject) => {
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/removePartyHost";
            let body = "partyID=" + party.partyID +
                       "&facebookID=" + this.allMyData.me.facebookID;
            var headers = new Headers();
            headers.append('content-type', "application/x-www-form-urlencoded");
            let options= new RequestOptions({headers: headers});
            this.http.post(url, body, options).map(res => res.json()).subscribe(data => {
                if(data.succeeded){
                    resolve(data);
                }else{
                    reject(data.error);
                }
            });
        });
    }

    // curl http://localhost:5000/removeBarHost -d "barID=1&facebookID=90"
    public removeYourselfAsHostForBar(bar: Bar){
        return new Promise((resolve, reject) => {
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/removeBarHost";
            let body = "barID=" + bar.barID +
                       "&facebookID=" + this.allMyData.me.facebookID;
            var headers = new Headers();
            headers.append('content-type', "application/x-www-form-urlencoded");
            let options= new RequestOptions({headers: headers});
            this.http.post(url, body, options).map(res => res.json()).subscribe(data => {
                if(data.succeeded){
                    resolve(data);
                }else{
                    reject(data.error);
                }
            });
        });
    }

    public getPartiesImInvitedTo(){
        return new Promise((resolve, reject) => {
            var partiesImInvitedTo : string = "";
            if(this.allMyData.me.invitedTo != null){
                for(var key in this.allMyData.me.invitedTo){
                    partiesImInvitedTo += key + ",";
                }
                if(partiesImInvitedTo.length >= 1){
                    partiesImInvitedTo = partiesImInvitedTo.substr(0, partiesImInvitedTo.length-1); // take off the last comma
                }
            }
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/myParties?partyIDs=" + partiesImInvitedTo;
            this.http.get(url).map(res => res.json()).subscribe(data => {
                if(data.succeeded){
                    this.allMyData.invitedTo = deserialize<Party[]>(Party, data.parties);
                    if(this.allMyData.invitedTo == null){
                        this.allMyData.invitedTo = new Array<Party>();
                    }
                    for(let i = 0; i < this.allMyData.invitedTo.length; i++){
                        this.allMyData.invitedTo[i].fixMaps();
                        this.allMyData.invitedTo[i].preparePartyObjectForTheUI();
                    }
                    resolve(data);
                }else{
                    reject(data.error);
                }
            });
        });
    }

    public getFriends(){
        return new Promise((resolve, reject) => {
            var facebookIDs : string = "";
            if(this.allMyData.friends != null){
                for(let i = 0; i < this.allMyData.friends.length; i++){
                    facebookIDs += this.allMyData.friends[i].facebookID + ",";
                }
                if(facebookIDs.length >= 1){
                    facebookIDs = facebookIDs.substr(0, facebookIDs.length-1); // take off the last comma
                }
            }
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/getFriends?facebookIDs=" + facebookIDs;
            this.http.get(url).map(res => res.json()).subscribe(data => {
                if(data.succeeded){
                    this.allMyData.friends = deserialize<Friend[]>(Friend, data.people);
                    if(this.allMyData.friends == null){
                        this.allMyData.friends = new Array<Friend>();
                    }
                    this.allMyData.friends.sort(function(a, b){
                        if(b.name < a.name){
                            return 1;
                        }
                        if(b.name > a.name){
                            return -1;
                        }
                        return 0;
                    });
                    resolve(data);
                }else{
                    reject(data.error);
                }
            });
        });
    }

    public getPartiesImHosting(){
        return new Promise((resolve, reject) => {
            var partiesImHosting : string = "";
            if(this.allMyData.me.partyHostFor != null){
                for(var key in this.allMyData.me.partyHostFor){
                    partiesImHosting += key + ",";
                }
                if(partiesImHosting.length >= 1){
                    partiesImHosting = partiesImHosting.substr(0, partiesImHosting.length-1); // take off the last comma
                }
            }
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/getPartiesImHosting?partyIDs=" + partiesImHosting;
            this.http.get(url).map(res => res.json()).subscribe(data => {
                if(data.succeeded){
                    this.allMyData.partyHostFor = deserialize<Party[]>(Party, data.parties);
                    if(this.allMyData.partyHostFor == null){
                        this.allMyData.partyHostFor = new Array<Party>();
                    }
                    for(let i = 0; i < this.allMyData.partyHostFor.length; i++){
                        this.allMyData.partyHostFor[i].fixMaps();
                        this.allMyData.partyHostFor[i].preparePartyObjectForTheUI();
                    }
                    resolve(data);
                }else{
                    reject(data.error);
                }
            });
        });
    }

    public getBarsImHosting(){
        return new Promise((resolve, reject) => {
            var barsImHosting : string = "";
            if(this.allMyData.me.barHostFor != null){
                for(var key in this.allMyData.me.barHostFor){
                    barsImHosting += key + ",";
                }
                if(barsImHosting.length >= 1){
                    barsImHosting = barsImHosting.substr(0, barsImHosting.length-1); // take off the last comma
                }
            }
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/getBarsImHosting?barIDs=" + barsImHosting;
            this.http.get(url).map(res => res.json()).subscribe(data => {
                if(data.succeeded){
                    this.allMyData.barHostFor = deserialize<Bar[]>(Bar, data.bars);
                    if(this.allMyData.barHostFor == null){
                        this.allMyData.barHostFor = new Array<Bar>();
                    }
                    for(let i = 0; i < this.allMyData.barHostFor.length; i++){
                        this.allMyData.barHostFor[i].fixMaps();
                        this.allMyData.barHostFor[i].prepareBarObjectForTheUI();
                    }
                    resolve(data);
                }else{
                    reject(data.error);
                }
            });
        });
    }

    // curl "http://localhost:8080/barsCloseToMe?latitude=43&longitude=-89"
    public getBarsCloseToMe(coordinates : any){
        return new Promise((resolve, reject) => {
            var latitudeParameter = "latitude=" + coordinates.lat;
            var longitudeParameter = "longitude=" + coordinates.lng;
            var coordinatesParameter = latitudeParameter + "&" + longitudeParameter;
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/barsCloseToMe?" + coordinatesParameter;
            this.http.get(url).map(res => res.json()).subscribe(data => {
                if(data.succeeded){
                    this.allMyData.barsCloseToMe = deserialize<Bar[]>(Bar, data.bars);
                    if(this.allMyData.barsCloseToMe == null){
                        this.allMyData.barsCloseToMe = new Array<Bar>();
                    }
                    for(let i = 0; i < this.allMyData.barsCloseToMe.length; i++){
                        this.allMyData.barsCloseToMe[i].fixMaps();
                        this.allMyData.barsCloseToMe[i].prepareBarObjectForTheUI();
                    }
                    resolve(data);
                }else{
                    reject(data.error);
                }
            });
            
        });
    }

    // curl http://bumpin-env.us-west-2.elasticbeanstalk.com:80/createParty -d "facebookID=123050841787812&
    //          isMale=false&name=Melody%20Panil&address=120%20N%20Breese%20Terrace%20Madison%20WI%2053726&
    //          drinksProvided=true&endTime=2017-11-27T08:00:00Z&feeForDrinks=true&invitesForNewInvitees=4&details=none&
    //          latitude=43.070860&longitude=-89.413948&startTime=2017-11-27T01:00:00Z&title=Breese%20Through%20It&
    //          additionsListFacebookID=107798829983852,111354699627054&additionsListIsMale=false,false&
    //          additionsListName=Nancy%20Greeneescu,Betty%20Chaison&hostListFacebookIDs=122107341882417,115693492525474
    //          &hostListNames=Lisa%20Chengberg,Linda%20Qinstein"
    public createParty(party : Party){
        return new Promise((resolve, reject) => {
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/createParty";
            let body = "facebookID=" + this.allMyData.me.facebookID + "&isMale=" + this.allMyData.me.isMale + 
                       "&name=" + encodeURIComponent(this.allMyData.me.name) + "&address=" + encodeURIComponent(party.address) +
                       "&drinksProvided=" + party.drinksProvided + "&endTime=" + party.endTime + 
                       "&feeForDrinks=" + party.feeForDrinks + "&invitesForNewInvitees=" + party.invitesForNewInvitees +
                       "&details=" + encodeURIComponent(party.details) + "&latitude=" + party.latitude + 
                       "&longitude=" + party.longitude + "&startTime=" + party.startTime + 
                       "&title=" + encodeURIComponent(party.title);
            body += this.createHostListParametersForCreateQuery(party);
            body += this.createInviteeListParametersForCreatePartyQuery(party);
            var headers = new Headers();
            headers.append('content-type', "application/x-www-form-urlencoded");
            let options= new RequestOptions({headers: headers});
            this.http.post(url, body, options).map(res => res.json()).subscribe(data => {
                if(data.succeeded){
                    party.partyID = data.error; // backend is set up so that data.error contains the partyID
                    resolve(data);
                }else{
                    reject(data.error);
                }
            });
        });
    }

    // &hostListNames=Lisa%20Chengberg,Linda%20Qinstein
    // &hostListFacebookIDs=122107341882417,115693492525474
    private createHostListParametersForCreateQuery(partyOrBar : any){
        let hostListNames : string = "";
        let hostListFacebookIDs : string = "";
        if(partyOrBar.hosts.size >= 2){
            hostListNames += "&hostListNames=";
            hostListFacebookIDs += "&hostListFacebookIDs=";
        }
        partyOrBar.hosts.forEach((value: any, key: string) => {
            if(partyOrBar.hosts.get(key).isMainHost == false){
                hostListNames += encodeURIComponent(partyOrBar.hosts.get(key).name) + ",";
                hostListFacebookIDs += key + ",";
            }
        });
        hostListNames = hostListNames.slice(0, hostListNames.length - 1);
        hostListFacebookIDs = hostListFacebookIDs.slice(0, hostListFacebookIDs.length - 1);
        return hostListNames + hostListFacebookIDs;
    }

    // &additionsListName=Nancy%20Greeneescu,Betty%20Chaison
    // &additionsListFacebookID=107798829983852,111354699627054
    // &additionsListIsMale=false,false
    private createInviteeListParametersForCreatePartyQuery(party : Party){
        let additionsListName : string = "";
        let additionsListFacebookID : string = "";
        let additionsListIsMale : string = "";
        if(party.invitees.size >= 1){
            additionsListName += "&additionsListName=";
            additionsListFacebookID += "&additionsListFacebookID=";
            additionsListIsMale += "&additionsListIsMale=";
        }
        party.invitees.forEach((value: any, key: string) => {
            additionsListName += encodeURIComponent(party.invitees.get(key).name) + ",";
            additionsListFacebookID += key + ",";
            additionsListIsMale += party.invitees.get(key).isMale + ",";
        });
        additionsListName = additionsListName.slice(0, additionsListName.length - 1);
        additionsListFacebookID = additionsListFacebookID.slice(0, additionsListFacebookID.length - 1);
        additionsListIsMale = additionsListIsMale.slice(0, additionsListIsMale.length - 1);
        return additionsListName + additionsListFacebookID + additionsListIsMale;
    }

    // curl http://localhost:5000/updateParty -d "partyID=13078678500578502570&address=8124%20N%20Seneca%20Rd
    //      &details=Steve%20=%20The%20Bomb&drinksProvided=true&endTime=2017-12-25T02:00:00Z&feeForDrinks=false
    //      &invitesForNewInvitees=3&latitude=43.1647483&longitude=-87.90766209999998&startTime=2017-12-23T19:02:00Z
    //      &title=Steves%20DA%20BOMB%20Party&additionsListFacebookID=107798829983852,111354699627054
    //      &additionsListIsMale=false,false&additionsListName=Nancy%20Greeneescu,Betty%20Chaison
    //      &hostsToAddFacebookIDs=122107341882417,115693492525474&hostsToAddNames=Lisa%20Chengberg,Linda%20Qinstein"
    public editParty(party : Party, inviteesToAdd : Map<string,Invitee>, inviteesToRemove : Map<string,Invitee>, hostsToAdd : Map<string,Host>, hostsToRemove : Map<string,Host>){
        return new Promise((resolve, reject) => {
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/updateParty";
            let body = "partyID=" + party.partyID + "&facebookID=" + this.allMyData.me.facebookID + "&isMale=" + this.allMyData.me.isMale + 
                       "&name=" + encodeURIComponent(this.allMyData.me.name) + "&address=" + encodeURIComponent(party.address) +
                       "&drinksProvided=" + party.drinksProvided + "&endTime=" + party.endTime + 
                       "&feeForDrinks=" + party.feeForDrinks + "&invitesForNewInvitees=" + party.invitesForNewInvitees +
                       "&details=" + encodeURIComponent(party.details) + "&latitude=" + party.latitude + 
                       "&longitude=" + party.longitude + "&startTime=" + party.startTime + 
                       "&title=" + encodeURIComponent(party.title);
            body += this.createHostListParametersForEditQuery(hostsToAdd, hostsToRemove);
            body += this.createInviteeListParametersForEditPartyQuery(party, inviteesToAdd, inviteesToRemove);
            var headers = new Headers();
            headers.append('content-type', "application/x-www-form-urlencoded");
            let options= new RequestOptions({headers: headers});
            this.http.post(url, body, options).map(res => res.json()).subscribe(data => {
                if(data.succeeded){
                    resolve(data);
                }else{
                    console.log(data.error);
                    reject(data.error);
                }
            });
        });
    }

    // curl http://bumpin-env.us-west-2.elasticbeanstalk.com:80/deleteParty -d "partyID=5233516922553495941"
    public deleteParty(party : Party){
        return new Promise((resolve, reject) => {
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/deleteParty";
            let body = "partyID=" + party.partyID;
            var headers = new Headers();
            headers.append('content-type', "application/x-www-form-urlencoded");
            let options= new RequestOptions({headers: headers});
            this.http.post(url, body, options).map(res => res.json()).subscribe(data => {
                if(data.succeeded){
                    resolve(data);
                }else{
                    reject(data.error);
                }
            });
        });
    }

    // &hostsToAddFacebookIDs=122107341882417,115693492525474
    // &hostsToAddNames=Lisa%20Chengberg,Linda%20Qinstein
    // &hostsToRemoveFacebookIDs=122107341882417,115693492525474"
    private createHostListParametersForEditQuery(hostsToAdd : Map<string,Host>, hostsToRemove : Map<string,Host>){
        let hostsToAddFacebookIDs : string = "";
        let hostsToAddNames : string = "";
        let hostsToRemoveFacebookIDs : string = "";
        if(hostsToAdd.size >= 1){
            hostsToAddNames += "&hostsToAddNames=";
            hostsToAddFacebookIDs += "&hostsToAddFacebookIDs=";
        }
        hostsToAdd.forEach((value: any, key: string) => {
            hostsToAddNames += encodeURIComponent(hostsToAdd.get(key).name) + ",";
            hostsToAddFacebookIDs += key + ",";
        });
        hostsToAddNames = hostsToAddNames.slice(0, hostsToAddNames.length - 1);
        hostsToAddFacebookIDs = hostsToAddFacebookIDs.slice(0, hostsToAddFacebookIDs.length - 1);

        if(hostsToRemove.size >= 1){
            hostsToRemoveFacebookIDs += "&hostsToRemoveFacebookIDs=";
        }
        hostsToRemove.forEach((value: any, key: string) => {
            hostsToRemoveFacebookIDs += key + ",";
        });
        hostsToRemoveFacebookIDs = hostsToRemoveFacebookIDs.slice(0, hostsToRemoveFacebookIDs.length - 1);

        return hostsToAddNames + hostsToAddFacebookIDs + hostsToRemoveFacebookIDs;
    }

    // &additionsListName=Nancy%20Greeneescu,Betty%20Chaison
    // &additionsListFacebookID=107798829983852,111354699627054
    // &additionsListIsMale=false,false
    // &removalsListFacebookID=107798829983852,111354699627054
    private createInviteeListParametersForEditPartyQuery(party : Party, inviteesToAdd : Map<string,Invitee>, inviteesToRemove : Map<string,Invitee>){
        let additionsListName : string = "";
        let additionsListFacebookID : string = "";
        let additionsListIsMale : string = "";
        let removalsListFacebookID : string = "";
        if(inviteesToAdd.size >= 1){
            additionsListName += "&additionsListName=";
            additionsListFacebookID += "&additionsListFacebookID=";
            additionsListIsMale += "&additionsListIsMale=";
        }
        inviteesToAdd.forEach((value: any, key: string) => {
            additionsListName += encodeURIComponent(inviteesToAdd.get(key).name) + ",";
            additionsListFacebookID += key + ",";
            additionsListIsMale += inviteesToAdd.get(key).isMale + ",";
        });
        additionsListName = additionsListName.slice(0, additionsListName.length - 1);
        additionsListFacebookID = additionsListFacebookID.slice(0, additionsListFacebookID.length - 1);
        additionsListIsMale = additionsListIsMale.slice(0, additionsListIsMale.length - 1);

        if(inviteesToRemove.size >= 1){
            removalsListFacebookID += "&removalsListFacebookID=";
        }
        inviteesToRemove.forEach((value: any, key: string) => {
            removalsListFacebookID += key + ",";
        });
        removalsListFacebookID = removalsListFacebookID.slice(0, removalsListFacebookID.length - 1);

        return additionsListName + additionsListFacebookID + additionsListIsMale + removalsListFacebookID;
    }

    // curl http://localhost:5000/sendInvitationsAsGuestOfParty -d "
    //      partyID=17717147682844711033&
    //      guestFacebookID=111354699627054&
    //      additionsListFacebookID=184484668766597,114947809267026&
    //      additionsListIsMale=true,true&
    //      additionsListName=Mike%20Panditman,Tom%20Rosenthalsen"
    public sendInvitationsAsGuestOfParty(party : Party, inviteesToAdd : Map<string,Invitee>){
        return new Promise((resolve, reject) => {
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/sendInvitationsAsGuestOfParty";
            let body = "partyID=" + party.partyID + "&guestFacebookID=" + this.allMyData.me.facebookID;
            body += this.createInviteeListParametersForSendInvitationsAsGuestOfPartyQuery(inviteesToAdd);
            var headers = new Headers();
            headers.append('content-type', "application/x-www-form-urlencoded");
            let options= new RequestOptions({headers: headers});
            this.http.post(url, body, options).map(res => res.json()).subscribe(data => {
                if(data.succeeded){
                    resolve(data);
                }else{
                    reject(data.error);
                }
            });
        });
    }

    //      additionsListFacebookID=184484668766597,114947809267026&
    //      additionsListIsMale=true,true&
    //      additionsListName=Mike%20Panditman,Tom%20Rosenthalsen"
    private createInviteeListParametersForSendInvitationsAsGuestOfPartyQuery(inviteesToAdd : Map<string,Invitee>){
        let additionsListName : string = "";
        let additionsListFacebookID : string = "";
        let additionsListIsMale : string = "";
        if(inviteesToAdd.size >= 1){
            additionsListName += "&additionsListName=";
            additionsListFacebookID += "&additionsListFacebookID=";
            additionsListIsMale += "&additionsListIsMale=";
        }
        inviteesToAdd.forEach((value: any, key: string) => {
            additionsListName += encodeURIComponent(inviteesToAdd.get(key).name) + ",";
            additionsListFacebookID += key + ",";
            additionsListIsMale += inviteesToAdd.get(key).isMale + ",";
        });
        additionsListName = additionsListName.slice(0, additionsListName.length - 1);
        additionsListFacebookID = additionsListFacebookID.slice(0, additionsListFacebookID.length - 1);
        additionsListIsMale = additionsListIsMale.slice(0, additionsListIsMale.length - 1);

        return additionsListName + additionsListFacebookID + additionsListIsMale;
    }

    public getAddressForBarKey(bar: Bar){
        return new Promise((resolve, reject) => {
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/getBarKey";
            let body = "key=" + bar.key;
            var headers = new Headers();
            headers.append('content-type', "application/x-www-form-urlencoded");
            let options= new RequestOptions({headers: headers});
            this.http.post(url, body, options).map(res => res.json()).subscribe(data => {
                if(data.succeeded){
                    resolve(data);
                }else{
                    reject(data.error);
                }
            });
        });
    }

    // curl http://bumpin-env.us-west-2.elasticbeanstalk.com:80/createBar -d "
    //      barKey=0r5qcj3UQHF2elJz
    //      &facebookID=111961819566368
    //      &isMale=true
    //      &nameOfCreator=Will%20Greenart
    //      &address=305%20N%20Midvale%20Blvd%20Apt%20D%20Madison%20WI
    //      &attendeesMapCleanUpHourInZulu=20
    //      &details=A%20bar%20for%20moms.
    //      &latitude=43.070011
    //      &longitude=-89.450809
    //      &name=Madtown%20Moms
    //      &phoneNumber=608-114-2323
    //      &timeZone=6
    //      &Mon=4PM-2AM,1:45AM
    //      &Tue=4PM-2AM,1:45AM
    //      &Wed=4PM-2AM,1:45AM
    //      &Thu=2PM-2:30AM,2:00AM
    //      &Fri=10AM-3AM,2:30AM
    //      &Sat=8AM-3AM,2:30AM
    //      &Sun=8AM-1AM,12:45AM
    //      &hostListFacebookIDs=122107341882417,115693492525474
    //      &hostListNames=Lisa%20Chengberg,Linda%20Qinstein
    public createBar(bar : Bar){
        return new Promise((resolve, reject) => {
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/createBar";
            let body = "barKey=" + bar.key +
                       "&facebookID=" + this.allMyData.me.facebookID + 
                       "&isMale=" + this.allMyData.me.isMale + 
                       "&nameOfCreator=" + encodeURIComponent(this.allMyData.me.name) +
                       "&address=" + encodeURIComponent(bar.address) +
                       "&attendeesMapCleanUpHourInZulu=" + bar.attendeesMapCleanUpHourInZulu +
                       "&details=" + encodeURIComponent(bar.details) + 
                       "&latitude=" + bar.latitude + 
                       "&longitude=" + bar.longitude + 
                       "&name=" + encodeURIComponent(bar.name) +
                       "&phoneNumber=" + encodeURIComponent(bar.phoneNumber) +
                       "&timeZone=" + bar.timeZone +
                       "&Mon=" + encodeURIComponent(bar.schedule.get("Monday").open + "," + bar.schedule.get("Monday").lastCall) + 
                       "&Tue=" + encodeURIComponent(bar.schedule.get("Tuesday").open + "," + bar.schedule.get("Tuesday").lastCall) + 
                       "&Wed=" + encodeURIComponent(bar.schedule.get("Wednesday").open + "," + bar.schedule.get("Wednesday").lastCall) + 
                       "&Thu=" + encodeURIComponent(bar.schedule.get("Thursday").open + "," + bar.schedule.get("Thursday").lastCall) + 
                       "&Fri=" + encodeURIComponent(bar.schedule.get("Friday").open + "," + bar.schedule.get("Friday").lastCall) + 
                       "&Sat=" + encodeURIComponent(bar.schedule.get("Saturday").open + "," + bar.schedule.get("Saturday").lastCall) + 
                       "&Sun=" + encodeURIComponent(bar.schedule.get("Sunday").open + "," + bar.schedule.get("Sunday").lastCall);
            body += this.createHostListParametersForCreateQuery(bar);
            var headers = new Headers();
            headers.append('content-type', "application/x-www-form-urlencoded");
            let options= new RequestOptions({headers: headers});
            this.http.post(url, body, options).map(res => res.json()).subscribe(data => {
                if(data.succeeded){
                    bar.barID = data.error; // backend is set up so that data.error contains the barID
                    this.allMyData.barHostFor.push(bar);
                    this.allMyData.barsCloseToMe.push(bar);
                    resolve(data);
                }else{
                    reject(data.error);
                }
            });
        });
    }

    // curl http://bumpin-env.us-west-2.elasticbeanstalk.com:80/updateBar -d "
    //      barID=1
    //      &facebookID=111961819566368
    //      &isMale=true
    //      &nameOfCreator=Will%20Greenart
    //      &address=305%20N%20Midvale%20Blvd%20Apt%20D%20Madison%20WI
    //      &attendeesMapCleanUpHourInZulu=20
    //      &details=A%20bar%20for%20moms.
    //      &latitude=43.070011
    //      &longitude=-89.450809
    //      &name=Madtown%20Moms
    //      &phoneNumber=608-114-2323
    //      &timeZone=6
    //      &Mon=4PM-2AM,1:45AM
    //      &Tue=4PM-2AM,1:45AM
    //      &Wed=4PM-2AM,1:45AM
    //      &Thu=2PM-2:30AM,2:00AM
    //      &Fri=10AM-3AM,2:30AM
    //      &Sat=8AM-3AM,2:30AM
    //      &Sun=8AM-1AM,12:45AM
    //      &hostListFacebookIDs=122107341882417,115693492525474
    //      &hostListNames=Lisa%20Chengberg,Linda%20Qinstein"
    //      &hostsToAddFacebookIDs=122107341882417,115693492525474&hostsToAddNames=Lisa%20Chengberg,Linda%20Qinstein"
    public editBar(bar : Bar, hostsToAdd : Map<string,Host>, hostsToRemove : Map<string,Host>){
        return new Promise((resolve, reject) => {
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/updateBar";
            let body =  "barID=" + bar.barID +
                        "&facebookID=" + this.allMyData.me.facebookID + 
                        "&isMale=" + this.allMyData.me.isMale + 
                        "&nameOfCreator=" + encodeURIComponent(this.allMyData.me.name) +
                        "&address=" + encodeURIComponent(bar.address) +
                        "&attendeesMapCleanUpHourInZulu=" + bar.attendeesMapCleanUpHourInZulu +
                        "&details=" + encodeURIComponent(bar.details) + 
                        "&latitude=" + bar.latitude + 
                        "&longitude=" + bar.longitude + 
                        "&name=" + encodeURIComponent(bar.name) +
                        "&phoneNumber=" + encodeURIComponent(bar.phoneNumber) +
                        "&timeZone=" + bar.timeZone +
                        "&Mon=" + encodeURIComponent(bar.schedule.get("Monday").open + "," + bar.schedule.get("Monday").lastCall) + 
                        "&Tue=" + encodeURIComponent(bar.schedule.get("Tuesday").open + "," + bar.schedule.get("Tuesday").lastCall) + 
                        "&Wed=" + encodeURIComponent(bar.schedule.get("Wednesday").open + "," + bar.schedule.get("Wednesday").lastCall) + 
                        "&Thu=" + encodeURIComponent(bar.schedule.get("Thursday").open + "," + bar.schedule.get("Thursday").lastCall) + 
                        "&Fri=" + encodeURIComponent(bar.schedule.get("Friday").open + "," + bar.schedule.get("Friday").lastCall) + 
                        "&Sat=" + encodeURIComponent(bar.schedule.get("Saturday").open + "," + bar.schedule.get("Saturday").lastCall) + 
                        "&Sun=" + encodeURIComponent(bar.schedule.get("Sunday").open + "," + bar.schedule.get("Sunday").lastCall);
            body += this.createHostListParametersForEditQuery(hostsToAdd, hostsToRemove);
            var headers = new Headers();
            headers.append('content-type', "application/x-www-form-urlencoded");
            let options= new RequestOptions({headers: headers});
            this.http.post(url, body, options).map(res => res.json()).subscribe(data => {
                if(data.succeeded){
                    resolve(data);
                }else{
                    reject(data.error);
                }
            });
        });
    }

    // curl http://bumpin-env.us-west-2.elasticbeanstalk.com:80/deleteBar -d "barID=5233516922553495941"
    public deleteBar(bar : Bar){
        return new Promise((resolve, reject) => {
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/deleteBar";
            let body = "barID=" + bar.barID;
            var headers = new Headers();
            headers.append('content-type', "application/x-www-form-urlencoded");
            let options= new RequestOptions({headers: headers});
            this.http.post(url, body, options).map(res => res.json()).subscribe(data => {
                if(data.succeeded){
                    resolve(data);
                }else{
                    reject(data.error);
                }
            });
        });
    }

    // curl http://bumpin-env.us-west-2.elasticbeanstalk.com:80/createBug -d "facebookID=12&description=wow%20it%20works"
    public createBug(facebookID : string, description : string){
        return new Promise((resolve, reject) => {
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/createBug";
            let body = "facebookID=" + facebookID + "&description=" + encodeURIComponent(description);
            var headers = new Headers();
            headers.append('content-type', "application/x-www-form-urlencoded");
            let options= new RequestOptions({headers: headers});
            this.http.post(url, body, options).map(res => res.json()).subscribe(data => {
                if(data.succeeded){
                    resolve(data);
                }else{
                    reject(data.error);
                }
            });
        });
    }

    // curl http://bumpin-env.us-west-2.elasticbeanstalk.com:80/createFeatureRequest -d "facebookID=12&description=wow%20it%20works"
    public createFeatureRequest(facebookID : string, description : string){
        return new Promise((resolve, reject) => {
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/createFeatureRequest";
            let body = "facebookID=" + facebookID + "&description=" + encodeURIComponent(description);
            var headers = new Headers();
            headers.append('content-type', "application/x-www-form-urlencoded");
            let options= new RequestOptions({headers: headers});
            this.http.post(url, body, options).map(res => res.json()).subscribe(data => {
                if(data.succeeded){
                    resolve(data);
                }else{
                    reject(data.error);
                }
            });
        });
    }

    // curl http://bumpin-env.us-west-2.elasticbeanstalk.com:80/logError -d "ID=Find%20Tab&errorType=server&errorDescription=Blah%20blah"
    public logError(pageName : string, errorType : string, errorDescription: string){
        return new Promise((resolve, reject) => {
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/logError";
            let body = "ID=" + encodeURIComponent(pageName) + "&errorType=" + encodeURIComponent(errorType) + "&errorDescription=" + encodeURIComponent(errorDescription);
            var headers = new Headers();
            headers.append('content-type', "application/x-www-form-urlencoded");
            let options= new RequestOptions({headers: headers});
            this.http.post(url, body, options).map(res => res.json()).subscribe(data => {
                if(data.succeeded){
                    resolve(data);
                }else{
                    reject(data.error);
                }
            });
            resolve();
        });
    }
}
