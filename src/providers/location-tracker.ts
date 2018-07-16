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
import { Storage } from '@ionic/storage';
 
@Injectable()
export class LocationTracker {
 
  private analyticsID: string = "Location Tracker";
  public watch: Observable<Geoposition>;
  private geolocationSubscription : Subscription; 
  public lat: number = 0;
  public lng: number = 0;
  private vicinityDistance: number;
  private partiesAndBarsThatAreInMyVicinity : Map<string,any>;
  public userLastCheckedInAt: Date;
  public userIsCheckedIn: boolean;
  public barUserIsCheckedInto: Bar;
  public partyUserIsCheckedInto: Party;
  private mapOfTimeUserEnteredVicinityDistanceOfPartiesAndBars: Map<string, Date>;
  private closestPartyOrBar : any;
  
 
  constructor(private allMyData : AllMyData, private storage: Storage, private localNotifications: LocalNotifications, private diagnostic: Diagnostic, private events : Events, public zone: NgZone, private backgroundGeolocation: BackgroundGeolocation, private geolocation: Geolocation, private http : Http) {
    this.vicinityDistance = 300;
    this.partiesAndBarsThatAreInMyVicinity = new Map<string,Party>();
    this.mapOfTimeUserEnteredVicinityDistanceOfPartiesAndBars = new Map<string,Date>();
    this.closestPartyOrBar = null;

    let yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    this.userLastCheckedInAt = yesterday;
    this.userIsCheckedIn = false;
    this.partyUserIsCheckedInto = null;
    this.barUserIsCheckedInto = null;
    this.storage.get("userLastCheckedInAt")
    .then((val : string) => {
        if((val == null)){
          this.storage.set("userLastCheckedInAt", yesterday.toISOString());
        }else {
          this.userLastCheckedInAt = new Date(val);
        }
    });
    this.storage.get("userIsCheckedIn")
    .then((val : string) => {
        if((val == null)){
          this.storage.set("userIsCheckedIn", "false");
        }else {
          if(val == "true"){
            this.userIsCheckedIn = true;
          }else{
            this.userIsCheckedIn = false;
          }
        }
    });
    this.storage.get("partyUserIsCheckedInTo")
    .then((val : string) => {
        if((val != null)){
          for(let i = 0; i < this.allMyData.invitedTo.length; i++){
            if(this.allMyData.invitedTo[i].partyID == val){
              this.partyUserIsCheckedInto = this.allMyData.invitedTo[i];
              this.barUserIsCheckedInto = null;
              break;
            }
          }
        }
    });
    this.storage.get("barUserIsCheckedInTo")
    .then((val : string) => {
        if((val != null)){
          if(this.allMyData.barsCloseToMeMap.has(val) == true){
            this.barUserIsCheckedInto = this.allMyData.barsCloseToMeMap.get(val);
            this.partyUserIsCheckedInto = null;
          }
        }
    });
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

    // Foreground

    let foregroundConfig = {
      enableHighAccuracy: true
    };

    this.watch = this.geolocation.watchPosition(foregroundConfig).filter((p: any) => p.code === undefined);
    this.watch.subscribe((position: Geoposition) => {
      this.zone.run(() => {
        this.lat = position.coords.latitude;
        this.lng = position.coords.longitude;
        this.events.publish("timeToUpdateUserLocation");
        console.log("updated location");
      });
    });

    // Background
    
    let backgroundConfig = {
      stopOnTerminate: false,
      desiredAccuracy: 0,
      stationaryRadius: 5,
      distanceFilter: 5,
      debug: false
    };

    this.geolocationSubscription = this.backgroundGeolocation.configure(backgroundConfig).subscribe((location: BackgroundGeolocationResponse) => {
      let notificationHasBeenScheduled = false;
      
      let dateOfLocation = new Date(location.time);
      this.allMyData.logError(this.analyticsID, "client", "location changed at: " + dateOfLocation.getHours() + ":" + dateOfLocation.getMinutes() + ":" + dateOfLocation.getSeconds(), this.http);

      this.closestPartyOrBar = this.findPartiesOrBarsInMyVicinity(location.latitude, location.longitude);

      let shouldUpdateUI = false;
      /*
      if(lastCheckInTime is more than 45 minutes ago){
        userCheckedIn = false
      }
      */
      if((new Date().getTime() - this.userLastCheckedInAt.getTime()) > 2700000){ // 2,700,000 milliseconds is 45 minutes
          this.userIsCheckedIn = false;
      }

      /*
      if(user is checked-in){
        if(user is NOT within 300m of the checked-in bar){
          userCheckedIn = false
          update that they aren’t at the bar
          cancel any scheduled notifications
        }
      }
      */
      if(this.userIsCheckedIn){
        if(this.partyUserIsCheckedInto != null){
          if(this.isUserWithinVicinityDistanceOfThisBarOrParty(this.partyUserIsCheckedInto) == false){
            this.userIsCheckedIn = false;
            this.allMyData.changeAtPartyStatus(this.partyUserIsCheckedInto, false, this.http)
            .catch((err) => {
              this.allMyData.logError(this.analyticsID, "server", "Issue changing atParty status : Err msg = " + err, this.http);
            });
            shouldUpdateUI = true;
            this.localNotifications.clearAll();
          }
        }
        if(this.barUserIsCheckedInto != null){
          if(this.isUserWithinVicinityDistanceOfThisBarOrParty(this.barUserIsCheckedInto) == false){
            this.userIsCheckedIn = false;
            this.allMyData.changeAtBarStatus(this.barUserIsCheckedInto, false, this.http)
            .catch((err) => {
              this.allMyData.logError(this.analyticsID, "server", "Issue changing atBar status : Err msg = " + err, this.http);
            });
            shouldUpdateUI = true;
            this.localNotifications.clearAll();
          }
        }
      }

      /*
      for each timer {
        if (bar of timer is NOT within 300 meters of user){
          delete the timer
        }
      }
      */
     this.mapOfTimeUserEnteredVicinityDistanceOfPartiesAndBars.forEach((val: any, key: string) => {
        if(val instanceof Party){
          if(this.partiesAndBarsThatAreInMyVicinity.has(val.partyID) == false){
            this.mapOfTimeUserEnteredVicinityDistanceOfPartiesAndBars.delete(key);
          }
        }
        if(val instanceof Bar){
          if(this.partiesAndBarsThatAreInMyVicinity.has(val.barID) == false){
            this.mapOfTimeUserEnteredVicinityDistanceOfPartiesAndBars.delete(key);
          }
        }
     });

      /*
      for each bar within 300 meters of user {
        if(bar has a timer for it already){
          If(timer has been active for more than 5 minutes AND closestBar is not null AND user is NOT checked in){
            clear ALL timers
            assume user is at the closest bar to them
            send a check-in notification to them (asking them if they are at that closest bar to them)
            break
          }
        }else{
          create and start a timer for this bar
        }
      }
      */
      this.partiesAndBarsThatAreInMyVicinity.forEach((val: any, key: string) => {
        let bar : Bar = null;
        let party : Party = null;
        if(val instanceof Party){
          party = val;
          if(this.mapOfTimeUserEnteredVicinityDistanceOfPartiesAndBars.has(party.partyID) == true){
            if(this.userHasBeenWithinVicinityDistanceOfPartyOrBarForMoreThan5Minutes(party) == true && 
               this.closestPartyOrBar != null && this.userIsCheckedIn == false){
                // Clear timers
                this.mapOfTimeUserEnteredVicinityDistanceOfPartiesAndBars = new Map<string,Date>();
                // assume user is at the closest party to them
                this.allMyData.changeAtPartyStatus(this.closestPartyOrBar, true, this.http)
                .catch((err) => {
                  this.allMyData.logError(this.analyticsID, "server", "Issue changing atParty status : Err msg = " + err, this.http);
                });
                shouldUpdateUI = true;
                // send a check-in notification to them (asking them if they are at that closest bar to them)
                this.localNotifications.schedule({
                  title: 'Are you at ' + (<Party>this.closestPartyOrBar).title + '?',
                  text: 'Time = ' + dateOfLocation.getHours() + ":" + dateOfLocation.getMinutes() + ":" + dateOfLocation.getSeconds()
                });
                notificationHasBeenScheduled = true;
            }
          }else{
            this.mapOfTimeUserEnteredVicinityDistanceOfPartiesAndBars.set(party.partyID, new Date());
          }
        }else{
          bar = val;
          if(this.mapOfTimeUserEnteredVicinityDistanceOfPartiesAndBars.has(bar.barID) == true){
            if(this.userHasBeenWithinVicinityDistanceOfPartyOrBarForMoreThan5Minutes(bar) == true && 
               this.closestPartyOrBar != null && this.userIsCheckedIn == false){
                // Clear timers
                this.mapOfTimeUserEnteredVicinityDistanceOfPartiesAndBars = new Map<string,Date>();
                // assume user is at the closest bar to them
                this.allMyData.changeAtBarStatus(this.closestPartyOrBar, true, this.http)
                .catch((err) => {
                  this.allMyData.logError(this.analyticsID, "server", "Issue changing atBar status : Err msg = " + err, this.http);
                });
                shouldUpdateUI = true;
                // send a check-in notification to them (asking them if they are at that closest bar to them)
                this.localNotifications.schedule({
                  title: 'Are you at ' + (<Bar>this.closestPartyOrBar).name + '?',
                  text: 'Time = ' + dateOfLocation.getHours() + ":" + dateOfLocation.getMinutes() + ":" + dateOfLocation.getSeconds()
                });
                notificationHasBeenScheduled = true;
            }
          }else{
            this.mapOfTimeUserEnteredVicinityDistanceOfPartiesAndBars.set(bar.barID, new Date());
          }
        }

      });

      this.zone.run(() => {
        this.allMyData.thePartyOrBarIAmAt = this.closestPartyOrBar;;
        if(shouldUpdateUI == true){
          this.events.publish("timeToUpdateUI");
        }
        this.lat = location.latitude;
        this.lng = location.longitude;
        this.events.publish("timeToUpdateUserLocation");
      });

      /*
      if(lastCheckInTime is more than 45 minutes ago){
        userCheckedIn = false
      }
    
      if(user is checked-in){
        if(user is NOT within 300m of the checked-in bar){
          userCheckedIn = false
          update that they aren’t at the bar
          cancel any scheduled notifications
        }
      }
    
      for each timer {
        if (bar of timer is NOT within 300 meters of user){
          delete the timer
        }
      }
    
      for each bar within 300 meters of user {
        if(bar has a timer for it already){
          If(timer has been active for more than 5 minutes AND closestBar is not null AND user is NOT checked in){
            clear ALL timers
            assume user is at the closest bar to them
            send a check-in notification to them (asking them if they are at that closest bar to them)
            break
          }
          
        }else{
          create and start a timer for this bar
        }
      }
      */

      /*
      Upon checking in{
        cancel any scheduled notifications
        userCheckedIn = true
        lastCheckInTime = new Date();
        if assumption on where they are is incorrect {
          update our assumption on where they are
        }
        schedule another check-in notification after 30 minutes
      }
      */
      if(notificationHasBeenScheduled == false){
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
            title: 'Location Updated',
            text: 'Updated at ' + dateOfLocation.getHours() + ":" + dateOfLocation.getMinutes() + ":" + dateOfLocation.getSeconds() + ', closest bar is null'
          });
        }else{
          this.localNotifications.schedule({
            title: 'Distance to bar = ' + min,
            text: 'Updated at ' + dateOfLocation.getHours() + ":" + dateOfLocation.getMinutes() + ":" + dateOfLocation.getSeconds() + ', closest bar is ' + closestBar.name
          });
        }
      }

      // IMPORTANT:  You must execute the finish method here to inform the native plugin that you're finished,
      // and the background-task may be completed.  You must do this regardless if your HTTP request is successful or not.
      // IF YOU DON'T, ios will CRASH YOUR APP for spending too much time in the background.
      this.backgroundGeolocation.finish(); // FOR IOS ONLY

    });

    this.backgroundGeolocation.start();



    this.events.subscribe("updateMyAtBarAndAtPartyStatuses",() => {
      /*
      var thePartyOrBarIAmCurrentlyAt = this.findPartiesOrBarsInMyVicinity(this.lat, this.lng);
      this.zone.run(() => {
        this.allMyData.thePartyOrBarIAmAt = thePartyOrBarIAmCurrentlyAt;
        if(shouldUpdateUI == true){
          this.events.publish("timeToUpdateUI");
        }
      });*/
    });
  }

  stopTracking() {
    if(this.geolocationSubscription !== undefined){
      this.geolocationSubscription.unsubscribe();
    }
    this.backgroundGeolocation.stop();
  }

  userHasBeenWithinVicinityDistanceOfPartyOrBarForMoreThan5Minutes(partyOrBar : any){
    let fiveMinInMilli = 30000; // change back to 300000
    if(partyOrBar instanceof Bar){
      if(((new Date().getTime()) - this.mapOfTimeUserEnteredVicinityDistanceOfPartiesAndBars.get(partyOrBar.barID).getTime()) > fiveMinInMilli){
        return true;
      }
    }
    if(partyOrBar instanceof Party){
      if(((new Date().getTime()) - this.mapOfTimeUserEnteredVicinityDistanceOfPartiesAndBars.get(partyOrBar.partyID).getTime()) > fiveMinInMilli){
        return true;
      }
    }
    return false;
  }

  isUserWithinVicinityDistanceOfThisBarOrParty(partyOrBar : any){
    if(partyOrBar instanceof Party || partyOrBar instanceof Bar){
      let distance = Utility.getDistanceInMetersBetweenCoordinates(partyOrBar.latitude, partyOrBar.longitude, this.lat, this.lng);
      if(distance < this.vicinityDistance){
        return true;
      }
    }
    return false;
  }

  findPartiesOrBarsInMyVicinity(myLatitude : number, myLongitude : number) : any{
    let closestPartyOrBar = null;
    let min = Number.MAX_VALUE;
    if((myLatitude == null) || (myLongitude == null)){
      return;
    }

    this.partiesAndBarsThatAreInMyVicinity = new Map<string,any>();
    for(let bar of this.allMyData.barsCloseToMe){
      let distanceToBar = Utility.getDistanceInMetersBetweenCoordinates(myLatitude, myLongitude, bar.latitude, bar.longitude);
      if(distanceToBar <= this.vicinityDistance){
        this.partiesAndBarsThatAreInMyVicinity.set(bar.barID, bar);
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
          this.partiesAndBarsThatAreInMyVicinity.set(party.partyID, party);
          if(distanceToParty <= min){
            min = distanceToParty;
            closestPartyOrBar = party;
          }
        }
      }
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