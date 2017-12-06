import { Bar } from './bar';
import { Party, Invitee, Host } from './party';
import { Person } from './person';
import { Friend } from './friend';
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
            var url = "https://graph.facebook.com/me?fields=id,name,gender,friends{id,name,gender}&access_token=" + accessToken;
            //console.log("Sending the Facebook request now");
            this.http.get(url).map(res => res.json()).subscribe(data => {
                //console.log("Facebook data retrieved.");
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
            var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/myParties?partyIDs=" + partiesImHosting;
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
            body += this.createHostListParametersForCreatePartyQuery(party);
            body += this.createInviteeListParametersForCreatePartyQuery(party);
            var headers = new Headers();
            headers.append('content-type', "application/x-www-form-urlencoded");
            let options= new RequestOptions({headers: headers});
            this.http.post(url, body, options).map(res => res.json()).subscribe(data => {
                if(data.succeeded){
                    party.partyID = data.error; // backend is set up so that data.error contains the partyID
                    resolve(data);
                }else{
                    reject(data);
                }
            });
            resolve();
        });
    }

    // &hostListNames=Lisa%20Chengberg,Linda%20Qinstein
    // &hostListFacebookIDs=122107341882417,115693492525474
    private createHostListParametersForCreatePartyQuery(party : Party){
        let hostListNames : string = "";
        let hostListFacebookIDs : string = "";
        if(party.hosts.size >= 2){
            hostListNames += "&hostListNames=";
            hostListFacebookIDs += "&hostListFacebookIDs=";
        }
        party.hosts.forEach((value: any, key: string) => {
            if(party.hosts.get(key).isMainHost == false){
                hostListNames += encodeURIComponent(party.hosts.get(key).name) + ",";
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
            body += this.createHostListParametersForEditPartyQuery(party, hostsToAdd, hostsToRemove);
            body += this.createInviteeListParametersForEditPartyQuery(party, inviteesToAdd, inviteesToRemove);
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

    // &hostsToAddFacebookIDs=122107341882417,115693492525474
    // &hostsToAddNames=Lisa%20Chengberg,Linda%20Qinstein
    // &hostsToRemoveFacebookIDs=122107341882417,115693492525474"
    private createHostListParametersForEditPartyQuery(party : Party, hostsToAdd : Map<string,Host>, hostsToRemove : Map<string,Host>){
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
                    reject(data);
                }
            });
        });
    }
}
