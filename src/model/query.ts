import { Bar } from './bar';
import { Party } from './party';
import { Person } from './person';
import { AllMyData } from './allMyData';
import { Http, Headers, RequestOptions } from '@angular/http';
import { deserialize } from "serializer.ts/Serializer";
import { Geolocation } from 'ionic-native';

export class Query{
    constructor(private allMyData : AllMyData, private http : Http){
      
    }

    public static promisePractice(resolveIt : boolean) {
        return new Promise((resolve, reject) => {
            if(resolveIt){
                resolve("It resolved!");
            }else{
                reject(new Error("Something awful happened"));
            }
        });
    }

    // curl "https://graph.facebook.com/me?fields=id,name,gender,friends&access_token=EAACEdEose0cBAB6rZA5M4FggQWjpvo7FUv0iRA4xpFZBZAdL5ElYrbNC92YAaaf1gy9zyVYfxyHWE51YcQ6Jh7hFhP9cgoJhQQapczYr1qZAs7ZCa4Re3ifb9q1zRBdVybE5KvydgUFo5Rs6DvEKZCWuFUdpMbjtkzQXMWh8dSGgvAWDah0rNTAZBIzo8JJxyAZD"
    public refreshMyDataFromFacebook(accessToken : string){
        //console.log("Query.ts: in refreshMyDataFromFacebook");
        return new Promise((resolve, reject) => {
            var url = "https://graph.facebook.com/me?fields=id,name,gender,friends&access_token=" + accessToken;
            //console.log("Sending the Facebook request now");
            this.http.get(url).map(res => res.json()).subscribe(data => {
                //console.log("Facebook data retrieved.");
                // TODO: Might need to eventually check for an error here.
                console.log("This is the data from Facebook: " + "id = " + data.id + ", gender = " + data.gender + ", name = " + data.name);
                console.log("This is my friend's list: ");
                for(let i = 0; i < data.friends.data.length; i++){
                    console.log("Friend " + i + " is " + data.friends.data[i].name);
                }
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
    
    public getPerson(facebookID : string){
        return new Promise((resolve, reject) => {
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/getPerson?facebookID=" + facebookID;
            this.http.get(url).map(res => res.json()).subscribe(data => {
                if(data.succeeded){
                    this.allMyData.me = deserialize<Person>(Person, data.people[0]);
                    resolve(data);
                }else{
                    reject(data);
                }
            });
        });
    }
    
    public createOrUpdatePerson(facebookID : string, isMale : boolean, name : string){
        // let body = "facebookID=10155613117039816&isMale=true&name=Steve%20Ellmaurer";
        return new Promise((resolve, reject) => {
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/createOrUpdatePerson";
            let body = "facebookID=" + facebookID + "&isMale=" + isMale + "&name=" + encodeURIComponent(name);
            var headers = new Headers();
            headers.append('content-type', "application/x-www-form-urlencoded");
            let options= new RequestOptions({headers: headers});
            this.http.post(url, body, options).map(res => res.json()).subscribe(data => {
                if(data.succeeded){
                    resolve(data);
                }else{
                    reject(data);
                }
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
                    reject(data);
                }
            });
            resolve();
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
                    reject(data);
                }
            });
            resolve();
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
                    reject(data);
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
                    reject(data);
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
                    reject(data);
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
                    reject(data);
                }
            });
        });
    }

    public getParties(){
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
            //console.log("Parties I'm invited to: " + partiesImInvitedTo);
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/myParties?partyIDs=" + partiesImInvitedTo;
            this.http.get(url).map(res => res.json()).subscribe(data => {
                if(data.succeeded){
                    console.log("new party data acquired - starting to fix");
                    this.allMyData.invitedTo = deserialize<Party[]>(Party, data.parties);
                    if(this.allMyData.invitedTo == null){
                        this.allMyData.invitedTo = new Array<Party>();
                    }
                    for(let i = 0; i < this.allMyData.invitedTo.length; i++){
                        this.allMyData.invitedTo[i].fixMaps();
                        this.allMyData.invitedTo[i].preparePartyObjectForTheUI();
                    }
                    console.log("new party data fixed and ready");
                    resolve(data);
                }else{
                    reject(data);
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
                        // TODO : Fix this
                        //console.log(this.allMyData.barsCloseToMe[i]);
                        this.allMyData.barsCloseToMe[i].fixMaps();
                        this.allMyData.barsCloseToMe[i].prepareBarObjectForTheUI();
                    }
                    resolve(data);
                }else{
                    reject(data);
                }
            });
            
        });
    }
}
