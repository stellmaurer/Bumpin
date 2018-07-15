/*******************************************************
 * Copyright (C) 2018 Stephen Ellmaurer <stellmaurer@gmail.com>
 * 
 * This file is part of the Bumpin mobile app project.
 * 
 * The Bumpin project and any of the files within the Bumpin
 * project can not be copied and/or distributed without
 * the express permission of Stephen Ellmaurer.
 *******************************************************/

import { Injectable, NgZone } from '@angular/core';
import { BackgroundGeolocation, BackgroundGeolocationConfig, BackgroundGeolocationResponse } from '@ionic-native/background-geolocation';
import { Geolocation, Geoposition } from '@ionic-native/geolocation';
import 'rxjs/add/operator/filter';
import { AllMyData } from '../model/allMyData';
import { Party } from '../model/party';
import { Bar } from '../model/bar';
import { Utility } from '../model/utility';
import { Http } from '@angular/http';
import { Events } from 'ionic-angular';
import { Diagnostic } from '@ionic-native/diagnostic';
import { Observable, Subscription } from 'rxjs';
import { LocalNotifications } from '@ionic-native/local-notifications';
 
@Injectable()
export class LocationTracker {
 
  private analyticsID: string = "Location Tracker";
  //public watch: Observable<Geoposition>;   
  public watch: Observable<BackgroundGeolocationResponse>;
  private geolocationSubscription : Subscription; 
  public lat: number = 0;
  public lng: number = 0;
  private appWasJustStarted : boolean;
  private vicinityDistance: number;
  private partiesThatWereInMyVicinity : Map<string,Party>;
  private partiesThatAreInMyVicinity : Map<string,Party>;
  private barsThatAreInMyVicinity: Map<string,Bar>;
  private barsThatWereInMyVicinity: Map<string,Bar>;
 
  constructor(private allMyData : AllMyData, private localNotifications: LocalNotifications, private diagnostic: Diagnostic, private events : Events, public zone: NgZone, private backgroundGeolocation: BackgroundGeolocation, private http : Http) {
    this.appWasJustStarted = true;
    this.vicinityDistance = 300;
    this.partiesThatAreInMyVicinity = new Map<string,Party>();
    this.partiesThatWereInMyVicinity = new Map<string,Party>();
    this.barsThatAreInMyVicinity = new Map<string,Bar>();
    this.barsThatWereInMyVicinity = new Map<string,Bar>();
  }
 
  startTracking() {
    this.startTrackingUserLocationIfLocationPermissionGranted();
  }

  startTrackingUserLocationIfLocationPermissionGranted(){
    /*this.diagnostic.isLocationAuthorized()
    .then((isLocationAuthorized : boolean) => {
      if(isLocationAuthorized == true){
        this.actuallyStartTracking();
      }else{
        this.stopTracking();
      }
    }).catch((err) => {
      this.allMyData.logError(this.analyticsID, "client", "checkLocationPermissions error : Err msg = " + err, this.http);
    });*/
    this.actuallyStartTracking();
  }

  actuallyStartTracking(){
    
    let backgroundConfig = {
      stopOnTerminate: false,
      desiredAccuracy: 0,
      stationaryRadius: 5,
      distanceFilter: 5
    };

    this.watch = this.backgroundGeolocation.configure(backgroundConfig);
    this.geolocationSubscription = this.backgroundGeolocation.configure(backgroundConfig).subscribe((location: BackgroundGeolocationResponse) => {
      let dateOfLocation = new Date(location.time);
      
      this.allMyData.logError(this.analyticsID, "client", "location-tracker.ts: Mode = 1, location changed at: " + dateOfLocation.getHours() + ":" + dateOfLocation.getMinutes() + ":" + dateOfLocation.getSeconds(), this.http);

      var thePartyOrBarIAmCurrentlyAt = this.findPartiesOrBarsInMyVicinity(location.latitude, location.longitude);
      let needToUpdateAtBarStatuses = this.updateMyAtBarStatuses();
      let needToUpdateAtPartyStatuses = this.updateMyAtPartyStatuses();
      let shouldUpdateUI = needToUpdateAtBarStatuses || needToUpdateAtPartyStatuses;
      this.zone.run(() => {
        this.allMyData.thePartyOrBarIAmAt = thePartyOrBarIAmCurrentlyAt;
        if(shouldUpdateUI == true){
          this.events.publish("timeToUpdateUI");
        }
        this.lat = location.latitude;
        this.lng = location.longitude;
      });

      let closestBar : Bar = null;
      let min = Number.MAX_VALUE;

      for(let bar of this.allMyData.barsCloseToMe){
        let distanceToBar = Utility.getDistanceInMetersBetweenCoordinates(location.latitude, location.longitude, bar.latitude, bar.longitude);
        if(distanceToBar <= min){
          min = distanceToBar;
          closestBar = bar;
        }
      }
      if(closestBar == null){
        this.localNotifications.schedule({
          title: 'Mode 1, Location Updated',
          text: 'Updated at ' + dateOfLocation.getHours() + ":" + dateOfLocation.getMinutes() + ":" + dateOfLocation.getSeconds() + ', closest bar is null'
        });
      }else{
        this.localNotifications.schedule({
          title: 'Mode 1, Location Updated',
          text: 'Updated at ' + dateOfLocation.getHours() + ":" + dateOfLocation.getMinutes() + ":" + dateOfLocation.getSeconds() + ', closest bar is ' + closestBar.name
        });
      }

      // IMPORTANT:  You must execute the finish method here to inform the native plugin that you're finished,
      // and the background-task may be completed.  You must do this regardless if your HTTP request is successful or not.
      // IF YOU DON'T, ios will CRASH YOUR APP for spending too much time in the background.
      this.backgroundGeolocation.finish(); // FOR IOS ONLY

    });

    this.backgroundGeolocation.start();



    this.events.subscribe("updateMyAtBarAndAtPartyStatuses",() => {
      var thePartyOrBarIAmCurrentlyAt = this.findPartiesOrBarsInMyVicinity(this.lat, this.lng);
      let needToUpdateAtBarStatuses = this.updateMyAtBarStatuses();
      let needToUpdateAtPartyStatuses = this.updateMyAtPartyStatuses();
      let shouldUpdateUI = needToUpdateAtBarStatuses || needToUpdateAtPartyStatuses;
      this.zone.run(() => {
        this.allMyData.thePartyOrBarIAmAt = thePartyOrBarIAmCurrentlyAt;
        if(shouldUpdateUI == true){
          this.events.publish("timeToUpdateUI");
        }
      });
    });
  }

  stopTracking() {
    if(this.geolocationSubscription !== undefined){
      this.geolocationSubscription.unsubscribe();
    }
    this.backgroundGeolocation.stop();
  }

  updateMyAtPartyStatuses() : boolean{
    let needToUpdateUI = false;
    this.partiesThatWereInMyVicinity.forEach((value: Party, key: string) => {
      if(this.partiesThatAreInMyVicinity.has(key)){ // was at the party and still am
        this.allMyData.changeAtPartyStatus(value, true, this.http)
        .then((res) => {
        
        })
        .catch((err) => {
          this.allMyData.logError(this.analyticsID, "server", "changeAtPartyStatus query error : Err msg = " + err, this.http);
        });
      }else{ // was at the party and now I'm not there
        this.allMyData.changeAtPartyStatus(value, false, this.http)
        .then((res) => {
        
        })
        .catch((err) => {
          this.allMyData.logError(this.analyticsID, "server", "changeAtPartyStatus query error : Err msg = " + err, this.http);
        });
      }
      needToUpdateUI = true;
    });
    this.partiesThatAreInMyVicinity.forEach((value: Party, key: string) => {
      if(this.partiesThatWereInMyVicinity.has(key)){ // am at the party, and was at the party
        // already covered this case above
      }else{ // at the party and wasn't at the party before
        this.allMyData.changeAtPartyStatus(value, true, this.http)
        .then((res) => {
        
        })
        .catch((err) => {
          this.allMyData.logError(this.analyticsID, "server", "changeAtPartyStatus query error : Err msg = " + err, this.http);
        });
        needToUpdateUI = true;
      }
    });
    return needToUpdateUI;
  }

  updateMyAtBarStatuses() : boolean{
    let needToUpdateUI = false;
    this.barsThatWereInMyVicinity.forEach((value: Bar, key: string) => {
      if(this.barsThatAreInMyVicinity.has(key)){ // was at the bar and still am
        this.allMyData.changeAtBarStatus(value, true, this.http)
        .then((res) => {
        
        })
        .catch((err) => {
          this.allMyData.logError(this.analyticsID, "server", "changeAtBarStatus query error : Err msg = " + err, this.http);
        });
      }else{ // was at the bar and now I'm not there
        this.allMyData.changeAtBarStatus(value, false, this.http)
        .then((res) => {
          needToUpdateUI = true;
        })
        .catch((err) => {
          this.allMyData.logError(this.analyticsID, "server", "changeAtBarStatus query error : Err msg = " + err, this.http);
        });
      }
    });
    this.barsThatAreInMyVicinity.forEach((value: Bar, key: string) => {
      if(this.barsThatWereInMyVicinity.has(key)){ // am at the bar, and was at the bar
        // already covered this case above
      }else{ // at the bar and wasn't at the bar before
        this.allMyData.changeAtBarStatus(value, true, this.http)
        .then((res) => {
          needToUpdateUI = true;
        })
        .catch((err) => {
          this.allMyData.logError(this.analyticsID, "server", "changeAtBarStatus query error : Err msg = " + err, this.http);
        });
      }
    });
    return needToUpdateUI;
  }

  findPartiesOrBarsInMyVicinity(myLatitude : number, myLongitude : number) : any{
    let closestPartyOrBar = null;
    let min = Number.MAX_VALUE;
    if((myLatitude == null) || (myLongitude == null)){
      return;
    }
    this.partiesThatWereInMyVicinity = this.partiesThatAreInMyVicinity;
    this.barsThatWereInMyVicinity = this.barsThatAreInMyVicinity;
    this.partiesThatAreInMyVicinity = new Map<string,Party>();
    this.barsThatAreInMyVicinity = new Map<string,Bar>();
    for(let bar of this.allMyData.barsCloseToMe){
      let distanceToBar = Utility.getDistanceInMetersBetweenCoordinates(myLatitude, myLongitude, bar.latitude, bar.longitude);
      if(distanceToBar <= this.vicinityDistance){
        this.barsThatAreInMyVicinity.set(bar.barID, bar);
        if(distanceToBar <= min){
          min = distanceToBar;
          closestPartyOrBar = bar;
        }
      }
    }
    for(let party of this.allMyData.invitedTo){
      if(Utility.hasThisPartyStarted(party)){
        let distanceToParty = Utility.getDistanceInMetersBetweenCoordinates(myLatitude, myLongitude, party.latitude, party.longitude);
        if(distanceToParty <= this.vicinityDistance){
          this.partiesThatAreInMyVicinity.set(party.partyID, party);
          if(distanceToParty <= min){
            min = distanceToParty;
            closestPartyOrBar = party;
          }
        }
      }
    }
    return closestPartyOrBar;
  }

  updateMyAtPartyOrAtBarStatuses(partyOrBarIWasAt : any, partyOrBarIAmAt : any){
    //console.log("Party/bar i was at: " + partyOrBarIWasAt);
    //console.log("Party/bar i am at: " + partyOrBarIAmAt);
    let party : Party = null;
    let bar : Bar = null;

    if((partyOrBarIWasAt == null) && (partyOrBarIAmAt == null)){
      // no need to update anything because we weren't at a party/bar and we still aren't at
      //    a party/bar
      return false;
    }
    if((partyOrBarIWasAt == null) && (partyOrBarIAmAt != null)){
      // I wasn't previously at a bar/party, but now am, so I just need to communicate that I'm at
      //    this new party/bar.
      if(partyOrBarIAmAt instanceof Party){
        party = partyOrBarIAmAt;
        this.allMyData.changeAtPartyStatus(party, true, this.http)
        .then((res) => {
        
        })
        .catch((err) => {
          this.allMyData.logError(this.analyticsID, "server", "changeAtPartyStatus query error : Err msg = " + err, this.http);
        });
      }else{
        bar = partyOrBarIAmAt;
        this.allMyData.changeAtBarStatus(bar, true, this.http)
        .then((res) => {
        
        })
        .catch((err) => {
          this.allMyData.logError(this.analyticsID, "server", "changeAtBarStatus query error : Err msg = " + err, this.http);
        });
      }
    }else if((partyOrBarIWasAt != null) && (partyOrBarIAmAt == null)){
      // I was at a bar/party, but now I am not, so I just need to communicate that I'm not at that
      //    bar/party anymore.
      if(partyOrBarIWasAt instanceof Party){
        party = partyOrBarIWasAt;
        this.allMyData.changeAtPartyStatus(party, false, this.http)
        .then((res) => {
        
        })
        .catch((err) => {
          this.allMyData.logError(this.analyticsID, "server", "changeAtPartyStatus query error : Err msg = " + err, this.http);
        });
      }else{
        bar = partyOrBarIWasAt;
        this.allMyData.changeAtBarStatus(bar, false, this.http)
        .then((res) => {
        
        })
        .catch((err) => {
          this.allMyData.logError(this.analyticsID, "server", "changeAtBarStatus query error : Err msg = " + err, this.http);
        });
      }
    }else if((partyOrBarIWasAt != null) && (partyOrBarIAmAt != null)){
      let atTheSamePartyOrBar = false;
      // Check to see if we are at the same party/bar
      if((partyOrBarIWasAt instanceof Party) && (partyOrBarIAmAt instanceof Party)){
        let partyIWasAt : Party = partyOrBarIWasAt;
        let partyIAmAt : Party = partyOrBarIAmAt;
        if(partyIWasAt.partyID == partyIAmAt.partyID){
          // we make a call here because we need to update timeOfLastKnownLocation for the invitee
          this.allMyData.changeAtPartyStatus(partyIAmAt, true, this.http)
          .then((res) => {
        
          })
          .catch((err) => {
            this.allMyData.logError(this.analyticsID, "server", "changeAtPartyStatus query error : Err msg = " + err, this.http);
          });
          atTheSamePartyOrBar = true;
        }
      }else if((partyOrBarIWasAt instanceof Bar) && (partyOrBarIAmAt instanceof Bar)){
        let barIWasAt : Bar = partyOrBarIWasAt;
        let barIAmAt : Bar = partyOrBarIAmAt;
        if(barIWasAt.barID == barIAmAt.barID){
          // we make a call here because we need to update timeOfLastKnownLocation for the attendee
          this.allMyData.changeAtBarStatus(barIAmAt, true, this.http)
          .then((res) => {
        
          })
          .catch((err) => {
            this.allMyData.logError(this.analyticsID, "server", "changeAtBarStatus query error : Err msg = " + err, this.http);
          });
          atTheSamePartyOrBar = true;
        }
      }

      if(atTheSamePartyOrBar == false){
        // I was at a bar/party, and now I am at another bar/party, so I need to communicate that
        //    I'm not at the bar/party I was at, and that I'm at this new bar/party.
        //console.log("I was at a bar/party, and now I am at another bar/party, so I need to communicate that I'm not at the bar/party I was at, and that I'm at this new bar/party.");
        if(partyOrBarIWasAt instanceof Party){
          party = partyOrBarIWasAt;
          this.allMyData.changeAtPartyStatus(party, false, this.http)
          .then((res) => {
        
          })
          .catch((err) => {
            this.allMyData.logError(this.analyticsID, "server", "changeAtPartyStatus query error : Err msg = " + err, this.http);
          });
        }else{
          bar = partyOrBarIWasAt;
          this.allMyData.changeAtBarStatus(bar, false, this.http)
          .then((res) => {
        
          })
          .catch((err) => {
            this.allMyData.logError(this.analyticsID, "server", "changeAtBarStatus query error : Err msg = " + err, this.http);
          });
        }
        if(partyOrBarIAmAt instanceof Party){
          party = partyOrBarIAmAt;
          this.allMyData.changeAtPartyStatus(party, true, this.http)
          .then((res) => {
        
          })
          .catch((err) => {
            this.allMyData.logError(this.analyticsID, "server", "changeAtPartyStatus query error : Err msg = " + err, this.http);
          });
        }else{
          bar = partyOrBarIAmAt;
          this.allMyData.changeAtBarStatus(bar, true, this.http)
          .then((res) => {
        
          })
          .catch((err) => {
            this.allMyData.logError(this.analyticsID, "server", "changeAtBarStatus query error : Err msg = " + err, this.http);
          });
        }
      }
    }
    return true;
  }

  // if you are at a party/bar and close the app, then leave the part/bar and reopen the app,
  //  it still thinks you're there until the expiration time (15 minutes).
  checkAndUpdateIfYouNeedToSetYourAttendanceToFalse(){
    if((this.lat == 0) || (this.lng == 0)){
      return null;
    }
    if((this.allMyData.invitedTo.length == 0) && (this.allMyData.barsCloseToMe.length == 0)){
      return null;
    }
    this.appWasJustStarted = false;

    // Based off my current location, am I at a party or bar?
    let partyImActuallyAt : Party = null;
    let barImActuallyAt : Bar = null;
    if(this.allMyData.thePartyOrBarIAmAt instanceof Party){
      partyImActuallyAt = this.allMyData.thePartyOrBarIAmAt;
    }else{
      barImActuallyAt = this.allMyData.thePartyOrBarIAmAt;
    }

    // Based off the database, am I at a party or bar?
    let partyImAtInTheDatabase : Party = null;
    let barImAtInTheDatabase : Bar = null;
    for(let i = 0; i < this.allMyData.invitedTo.length; i++){
      if(this.allMyData.invitedTo[i].invitees.get(this.allMyData.me.facebookID).atParty == true){
        partyImAtInTheDatabase = this.allMyData.invitedTo[i];
        break;
      }
    }
    if(partyImAtInTheDatabase == null){
      for(let i = 0; i < this.allMyData.barsCloseToMe.length; i++){
        if(this.allMyData.barsCloseToMe[i].attendees.has(this.allMyData.me.facebookID) == true){
          if(this.allMyData.barsCloseToMe[i].attendees.get(this.allMyData.me.facebookID).atBar == true){
            barImAtInTheDatabase = this.allMyData.barsCloseToMe[i];
            break;
          }
        }
      }
    }

    // Determine if I need to update the database
    if(partyImAtInTheDatabase != null){
      if(partyImActuallyAt != null){
        if(partyImAtInTheDatabase.partyID != partyImActuallyAt.partyID){
          this.allMyData.changeAtPartyStatus(partyImAtInTheDatabase, false, this.http)
          .then((res) => {
        
          })
          .catch((err) => {
            this.allMyData.logError(this.analyticsID, "server", "changeAtPartyStatus query error : Err msg = " + err, this.http);
          });
        }
      }else{
        this.allMyData.changeAtPartyStatus(partyImAtInTheDatabase, false, this.http)
        .then((res) => {
        
        })
        .catch((err) => {
          this.allMyData.logError(this.analyticsID, "server", "changeAtPartyStatus query error : Err msg = " + err, this.http);
        });
      }
    }
    if(barImAtInTheDatabase != null){
      if(barImActuallyAt != null){
        if(barImAtInTheDatabase.barID != barImActuallyAt.barID){
          this.allMyData.changeAtBarStatus(barImAtInTheDatabase, false, this.http)
          .then((res) => {
        
          })
          .catch((err) => {
            this.allMyData.logError(this.analyticsID, "server", "changeAtBarStatus query error : Err msg = " + err, this.http);
          });
        }
      }else{
        this.allMyData.changeAtBarStatus(barImAtInTheDatabase, false, this.http)
        .then((res) => {
        
        })
        .catch((err) => {
          this.allMyData.logError(this.analyticsID, "server", "changeAtBarStatus query error : Err msg = " + err, this.http);
        });
      }
    }
    // If there aren't any parties or bars in the database that have me with atParty or atBar = true, then
    //      I don't need to do anything
  }

  // returns null if I am not within 40 meters of a party or bar
  findThePartyOrBarIAmAt(myLatitude : number, myLongitude : number){
    if((myLatitude == null) || (myLongitude == null)){
      return null;
    }
    if((this.allMyData.invitedTo.length == 0) && (this.allMyData.barsCloseToMe.length == 0)){
      return null;
    }
    let closestPartyOrBar = null;
    let min = Number.MAX_VALUE;
    for(let party of this.allMyData.invitedTo){
      let distanceToParty = Utility.getDistanceInMetersBetweenCoordinates(myLatitude, myLongitude, party.latitude, party.longitude);
      //console.log("Distance to " + party.title + " = " + distanceToParty + " meters away.");
      if(distanceToParty <= min){
        min = distanceToParty;
        closestPartyOrBar = party;
      }
    }
    for(let bar of this.allMyData.barsCloseToMe){
      let distanceToBar = Utility.getDistanceInMetersBetweenCoordinates(myLatitude, myLongitude, bar.latitude, bar.longitude);
      //console.log("Distance to " + bar.name + " = " + distanceToBar + " meters away.");
      if(distanceToBar <= min){
        min = distanceToBar;
        closestPartyOrBar = bar;
      }
    }
    //console.log("This is how far away the closest party/bar is: " + max);
    if((closestPartyOrBar == null) || (min > 40)){
      return null;
    }
    return closestPartyOrBar;
  }
 
  findClosestPartyOrBar(myLatitude : number, myLongitude : number) : any{
    if((myLatitude == null) || (myLongitude == null)){
      return null;
    }
    if((this.allMyData.invitedTo.length == 0) && (this.allMyData.barsCloseToMe.length == 0)){
      return null;
    }
    let closestPartyOrBar = null;
    let max = Number.MAX_VALUE;
    for(let party of this.allMyData.invitedTo){
      let distanceToParty = Utility.getDistanceInMetersBetweenCoordinates(myLatitude, myLongitude, party.latitude, party.longitude);
      //console.log("Distance to " + party.title + " = " + distanceToParty + " meters away.");
      if(distanceToParty <= max){
        max = distanceToParty;
        closestPartyOrBar = party;
      }
    }
    for(let bar of this.allMyData.barsCloseToMe){
      let distanceToBar = Utility.getDistanceInMetersBetweenCoordinates(myLatitude, myLongitude, bar.latitude, bar.longitude);
      //console.log("Distance to " + bar.name + " = " + distanceToBar + " meters away.");
      if(distanceToBar <= max){
        max = distanceToBar;
        closestPartyOrBar = bar;
      }
    }
    if(closestPartyOrBar == null){
      return null;
    }
    return closestPartyOrBar;
  }
}