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
    
    public createOrUpdatePerson(){
        // let body = "facebookID=10155613117039816&isMale=true&name=Steve%20Ellmaurer";
        return new Promise((resolve, reject) => {
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/createOrUpdatePerson";
            let body = "facebookID=10155613117039816&isMale=true&name=Steve%20Ellmaurer";
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

    // curl http://bumpin-env.us-west-2.elasticbeanstalk.com:80/rateParty -d "partyID=10583166241324703384&facebookID=10155613117039816&rating=Heating%20Up&timeLastRated=2017-03-04T00:57:00Z"
    public rateParty(partyID : string, facebookID : string, rating : string, timeLastRated : string){
        return new Promise((resolve, reject) => {
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/rateParty";
            let body = "partyID=" + partyID + "&facebookID=" + facebookID + "&rating=" + encodeURIComponent(rating) + "&timeLastRated=" + timeLastRated;
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

    // curl http://bumpin-env.us-west-2.elasticbeanstalk.com:80/rateBar -d "barID=5272501342297530080&facebookID=370&isMale=true&name=Steve&rating=Heating%20Up&status=Going&timeLastRated=2017-03-04T01:25:00Z"
    public rateBar(barID : string, facebookID : string, isMale : boolean, name : string, rating : string, status : string, timeLastRated : string){
        return new Promise((resolve, reject) => {
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/rateBar";
            let body = "barID=" + barID + "&facebookID=" + facebookID + "&isMale=" + isMale + "&name=" + name + "&rating=" + encodeURIComponent(rating) + "&status=" + status + "&timeLastRated=" + timeLastRated;
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

    // curl http://bumpin-env.us-west-2.elasticbeanstalk.com:80/changeAttendanceStatusToBar -d "barID=5272501342297530080&facebookID=9321&atBar=false&isMale=false&name=Emily%20Blunt&rating=None&status=Maybe&timeLastRated=2001-01-01T00:00:00Z"
    public changeAttendanceStatusToBar(barID : string, facebookID : string, atBar : boolean, isMale : boolean, name : string, rating : string, status : string, timeLastRated : string){
        return new Promise((resolve, reject) => {
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/changeAttendanceStatusToBar";
            // TODO: left off here!!!!
            let body = "barID=" + barID + "&facebookID=" + facebookID + "&atBar=" + atBar + "&isMale=" + isMale + "&name=" + name + "&rating=" + rating + "&status=" + status + "&timeLastRated=" + timeLastRated;
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

    public getPerson(){
        return new Promise((resolve, reject) => {
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/getPerson?facebookID=10155613117039816";
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
                    //let bars : Bar[] = data.bars;
                    //this.allMyData.barsCloseToMe = bars;
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
