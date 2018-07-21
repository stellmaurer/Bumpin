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
import { Events, IonicApp } from 'ionic-angular';
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
  public vicinityDistance: number;
  public partiesAndBarsThatAreInMyVicinity : Map<string,any>;
  public userLastCheckedInAt: Date;
  public userIsCheckedIn: boolean;
  public barUserIsCheckedInto: Bar;
  public partyUserIsCheckedInto: Party;
  private mapOfTimeUserEnteredVicinityDistanceOfPartiesAndBars: Map<string, Date>;
  private closestPartyOrBar : any;
  private attendanceTimer1 : NodeJS.Timer;
  private attendanceTimer2 : NodeJS.Timer;
  private attendanceTimer3 : NodeJS.Timer;
  private notificationTimer1 : NodeJS.Timer;
  private notificationTimer2 : NodeJS.Timer;
  private notificationTimer3 : NodeJS.Timer;
  public partyOrBarImAt: string;
  private partyOrBarIWasAt: string;
  private partyOrBarToSayImAt: string;
  private partyOrBarIWasAtBeforeThePartyOrBarIWasJustAt: string;
  
 
  constructor(private allMyData : AllMyData, private storage: Storage, private localNotifications: LocalNotifications, private diagnostic: Diagnostic, private events : Events, public zone: NgZone, private backgroundGeolocation: BackgroundGeolocation, private geolocation: Geolocation, private http : Http) {
    this.vicinityDistance = 2000;
    this.partiesAndBarsThatAreInMyVicinity = new Map<string,any>();
    this.mapOfTimeUserEnteredVicinityDistanceOfPartiesAndBars = new Map<string,Date>();
    this.closestPartyOrBar = null;
    this.partyOrBarImAt = null;
    this.partyOrBarIWasAt = null;
    this.partyOrBarToSayImAt = null;
    this.partyOrBarIWasAtBeforeThePartyOrBarIWasJustAt = null;

    let yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    this.userLastCheckedInAt = yesterday;
    this.userIsCheckedIn = false;
    this.partyUserIsCheckedInto = null;
    this.barUserIsCheckedInto = null;
    this.storage.get("userLastCheckedInAt")
    .then((val : Date) => {
      console.log("userLastCheckedInAt = " + val);
        if((val == null)){
          this.storage.set("userLastCheckedInAt", yesterday);
        }else {
          this.userLastCheckedInAt = new Date(val);
        }
    });
    this.storage.get("userIsCheckedIn")
    .then((val : boolean) => {
      console.log("userIsCheckedIn = " + val);
        if((val == null)){
          this.storage.set("userIsCheckedIn", false);
        }else {
          this.userIsCheckedIn = val;
        }
    });
    this.storage.get("partyUserIsCheckedInTo")
    .then((partyID : string) => {
      console.log("partyUserIsCheckedInTo = " + partyID);
        if((partyID != null)){
          for(let i = 0; i < this.allMyData.invitedTo.length; i++){
            if(this.allMyData.invitedTo[i].partyID == partyID){
              this.partyUserIsCheckedInto = this.allMyData.invitedTo[i];
            }
          }
        }
    });
    this.storage.get("barUserIsCheckedInto")
    .then((barID : string) => {
      console.log("barUserIsCheckedInto = " + barID);
        if((barID != null)){
          if(this.allMyData.barsCloseToMeMap.has(barID) == true){
            this.barUserIsCheckedInto = this.allMyData.barsCloseToMeMap.get(barID);
          }
        }
    });
    this.storage.get("partyOrBarImAt")
    .then((id : string) => {
      console.log("partyOrBarImAt = " + id);
        if((id != null)){
          this.partyOrBarImAt = id;
        }
    });
    this.storage.get("partyOrBarIWasAt")
    .then((id : string) => {
      console.log("partyOrBarIWasAt = " + id);
        if((id != null)){
          this.partyOrBarIWasAt = id;
        }
    });
    this.storage.get("partyOrBarIWasAtBeforeThePartyOrBarIWasJustAt")
    .then((id : string) => {
      console.log("partyOrBarIWasAtBeforeThePartyOrBarIWasJustAt = " + id);
        if((id != null)){
          this.partyOrBarIWasAtBeforeThePartyOrBarIWasJustAt = id;
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

    // Background
    
    let backgroundConfig = {
      stopOnTerminate: false,
      desiredAccuracy: 0,
      stationaryRadius: 5,
      distanceFilter: 5,
      debug: false
    };

    this.geolocationSubscription = this.backgroundGeolocation.configure(backgroundConfig).subscribe((location: BackgroundGeolocationResponse) => {
      LocalNotifications.getPlugin().clearAll();
      clearTimeout(this.notificationTimer1);
      clearTimeout(this.notificationTimer2);
      clearTimeout(this.notificationTimer3);
      clearTimeout(this.attendanceTimer1);
      clearTimeout(this.attendanceTimer2);
      clearTimeout(this.attendanceTimer3);
      let notificationHasBeenScheduled = false;
      let dateOfLocation = new Date(location.time);
      this.partyOrBarToSayImAt = null;

      this.closestPartyOrBar = this.findPartiesOrBarsInMyVicinity(location.latitude, location.longitude);

      let shouldUpdateUI = false;
      /*
      if(lastCheckInTime is more than 45 minutes ago){
        userCheckedIn = false
      }
      */
      if((new Date().getTime() - this.userLastCheckedInAt.getTime()) > 2700000){ // 2,700,000 milliseconds is 45 minutes
          this.userIsCheckedIn = false;
          this.barUserIsCheckedInto = null;
          this.partyUserIsCheckedInto = null;
          this.storage.set("userIsCheckedIn", false);
          this.storage.set("barUserIsCheckedInto", null);
          this.storage.set("partyUserIsCheckedInto", null);
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
          if((this.isUserWithinVicinityDistanceOfThisBarOrParty(this.partyUserIsCheckedInto) == false)){
            this.allMyData.changeAtPartyStatus(this.partyUserIsCheckedInto, false, this.http)
            .catch((err) => {
              this.allMyData.logError(this.analyticsID, "server", "Issue changing atParty status : Err msg = " + err, this.http);
            });
            this.userIsCheckedIn = false;
            this.partyUserIsCheckedInto = null;
            this.storage.set("userIsCheckedIn", false);
            this.storage.set("partyUserIsCheckedInto", null);
            shouldUpdateUI = true;
            LocalNotifications.getPlugin().clearAll();
            clearTimeout(this.notificationTimer1);
            clearTimeout(this.notificationTimer2);
            clearTimeout(this.notificationTimer3);
          }
        }
        if(this.barUserIsCheckedInto != null){
          if(this.isUserWithinVicinityDistanceOfThisBarOrParty(this.barUserIsCheckedInto) == false){
            this.allMyData.changeAtBarStatus(this.barUserIsCheckedInto, false, this.http)
            .catch((err) => {
              this.allMyData.logError(this.analyticsID, "server", "Issue changing atBar status : Err msg = " + err, this.http);
            });
            this.userIsCheckedIn = false;
            this.barUserIsCheckedInto = null;
            this.storage.set("userIsCheckedIn", false);
            this.storage.set("barUserIsCheckedInto", null);
            shouldUpdateUI = true;
            LocalNotifications.getPlugin().clearAll();
            clearTimeout(this.notificationTimer1);
            clearTimeout(this.notificationTimer2);
            clearTimeout(this.notificationTimer3);
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

     this.mapOfTimeUserEnteredVicinityDistanceOfPartiesAndBars.forEach((date: Date, key: string) => {
        if(this.allMyData.barsCloseToMeMap.has(key) == true)
        {
          if(this.partiesAndBarsThatAreInMyVicinity.has(key) == false){
            this.mapOfTimeUserEnteredVicinityDistanceOfPartiesAndBars.delete(key);
          }
        }else if (this.amIStillInvitedToThisParty(key) == true){
          if(this.partiesAndBarsThatAreInMyVicinity.has(key) == false){
            this.mapOfTimeUserEnteredVicinityDistanceOfPartiesAndBars.delete(key);
          }
        }else{
          this.mapOfTimeUserEnteredVicinityDistanceOfPartiesAndBars.delete(key);
        }
     });

      if(this.closestPartyOrBar instanceof Party){
        this.partyOrBarToSayImAt = this.closestPartyOrBar.partyID;
      }
      if(this.closestPartyOrBar instanceof Bar){
        this.partyOrBarToSayImAt = this.closestPartyOrBar.barID;
      }

      if(this.userIsCheckedIn == true){
        if(this.partyUserIsCheckedInto != null){
          this.partyOrBarToSayImAt = this.partyUserIsCheckedInto.partyID;
        }
        if(this.barUserIsCheckedInto != null){
          this.partyOrBarToSayImAt = this.barUserIsCheckedInto.barID;
        }
      }

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
                this.attendanceTimer1 = this.createTimerForUpdatingAttendance(0);
                this.attendanceTimer2 = this.createTimerForUpdatingAttendance(60000); // change to 30 min
                this.attendanceTimer3 = this.createTimerForUpdatingAttendance(120000); // change to 60 min
                // send a check-in notification to them (asking them if they are at that closest party to them)
                this.notificationTimer1 = this.createTimerForNotification(0);
                this.notificationTimer2 = this.createTimerForNotification(60000); // change to 30 min
                this.notificationTimer3 = this.createTimerForNotification(120000); // change to 60 min
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
                this.attendanceTimer1 = this.createTimerForUpdatingAttendance(0);
                this.attendanceTimer2 = this.createTimerForUpdatingAttendance(60000); // change to 30 min
                this.attendanceTimer3 = this.createTimerForUpdatingAttendance(120000); // change to 60 min
                // send a check-in notification to them (asking them if they are at that closest bar to them)
                this.notificationTimer1 = this.createTimerForNotification(0);
                this.notificationTimer2 = this.createTimerForNotification(60000); // change to 30 min
                this.notificationTimer3 = this.createTimerForNotification(120000); // change to 60 min
                notificationHasBeenScheduled = true;
            }
          }else{
            this.mapOfTimeUserEnteredVicinityDistanceOfPartiesAndBars.set(bar.barID, new Date());
          }
        }

      });

      this.zone.run(() => {
        if(shouldUpdateUI == true){
          this.events.publish("timeToRefreshMapMarkers");
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
          Problem: We might not get another location update if the user stops moving, which means our local notification
                   never gets scheduled.

          A fix: Schedule the notifications in advance.
          Algorithm:
                each time location is updated {
                  clear all notifications
                  logic determining when notifications should go out...
                  schedule notifications in case we don't get another location update
                }
      */
     if((notificationHasBeenScheduled == false) && (this.userIsCheckedIn == false)){
        let earliestTimeUserEnteredVicinity = this.determineWhenTheFirstNotificationShouldBeTriggered();
        let timeToTriggerFirstNotification = new Date(earliestTimeUserEnteredVicinity);
        timeToTriggerFirstNotification.setSeconds(earliestTimeUserEnteredVicinity.getSeconds() + 30); // change to 5 min
        let timeToTriggerSecondNotification = new Date(earliestTimeUserEnteredVicinity);
        timeToTriggerSecondNotification.setSeconds(earliestTimeUserEnteredVicinity.getSeconds() + 90)// change to 30 min
        let timeToTriggerThirdNotification = new Date(earliestTimeUserEnteredVicinity);
        timeToTriggerThirdNotification.setMinutes(earliestTimeUserEnteredVicinity.getMinutes() + 2) // change to 60
        
        if(this.partyOrBarToSayImAt != null){
          this.attendanceTimer1 = this.createTimerForUpdatingAttendance(timeToTriggerFirstNotification.getTime() - new Date().getTime()); // ~5 min
          this.attendanceTimer2 = this.createTimerForUpdatingAttendance(timeToTriggerSecondNotification.getTime() - new Date().getTime()); // ~30 min
          this.attendanceTimer3 = this.createTimerForUpdatingAttendance(timeToTriggerThirdNotification.getTime() - new Date().getTime()); // ~60 min
          this.notificationTimer1 = this.createTimerForNotification(timeToTriggerFirstNotification.getTime() - new Date().getTime()); // ~5 min
          this.notificationTimer2 = this.createTimerForNotification(timeToTriggerSecondNotification.getTime() - new Date().getTime()); // ~30 min
          this.notificationTimer3 = this.createTimerForNotification(timeToTriggerThirdNotification.getTime() - new Date().getTime()); // ~60 min
        }
      }

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
          LocalNotifications.getPlugin().schedule({
            id: -1,
            foreground: true,
            title: 'Location Updated',
            text: 'Updated at ' + dateOfLocation.getHours() + ":" + dateOfLocation.getMinutes() + ":" + dateOfLocation.getSeconds() + ', closest bar is null'
          });
        }else{
          LocalNotifications.getPlugin().schedule({
            id: -1,
            foreground: true,
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
      });
    });
  }

  stopTracking() {
    if(this.geolocationSubscription !== undefined){
      this.geolocationSubscription.unsubscribe();
    }
    this.backgroundGeolocation.stop();
  }

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
  checkIn(partyOrBar : any){
    LocalNotifications.getPlugin().clearAll();
    clearTimeout(this.notificationTimer1);
    clearTimeout(this.notificationTimer2);
    clearTimeout(this.notificationTimer3);
    clearTimeout(this.attendanceTimer1);
    clearTimeout(this.attendanceTimer2);
    clearTimeout(this.attendanceTimer3);
    if(partyOrBar instanceof Party){
        this.userLastCheckedInAt = new Date();
        this.userIsCheckedIn = true;
        this.partyUserIsCheckedInto = partyOrBar;
        this.barUserIsCheckedInto = null;
        this.allMyData.storage.set("userLastCheckedInAt", new Date());
        this.allMyData.storage.set("userIsCheckedIn", true);
        this.allMyData.storage.set("partyUserIsCheckedInto", partyOrBar.partyID);
        this.allMyData.storage.set("barUserIsCheckedInto", null);
        this.updateWhereIAmAt(partyOrBar.partyID);
    }
    if(partyOrBar instanceof Bar){
        this.userLastCheckedInAt = new Date();
        this.userIsCheckedIn = true;
        this.partyUserIsCheckedInto = null;
        this.barUserIsCheckedInto = partyOrBar;
        this.allMyData.storage.set("userLastCheckedInAt", new Date());
        this.allMyData.storage.set("userIsCheckedIn", true);
        this.allMyData.storage.set("partyUserIsCheckedInto", null);
        this.allMyData.storage.set("barUserIsCheckedInto", partyOrBar.barID);
        this.updateWhereIAmAt(partyOrBar.barID);
    }
    this.notificationTimer1 = this.createTimerForNotification(60000); // change to 30 min
    this.attendanceTimer1 = this.createTimerForUpdatingAttendance(60000); // change to 30 min
  }

  public updateWhereIAmAt(partyOrBarToSayImAt : string){

    if(partyOrBarToSayImAt == this.partyOrBarImAt){
      // don't update anything
    }else if(partyOrBarToSayImAt == this.partyOrBarIWasAt){
      this.partyOrBarIWasAtBeforeThePartyOrBarIWasJustAt = null;
      this.partyOrBarIWasAt = this.partyOrBarImAt;
      this.partyOrBarImAt = partyOrBarToSayImAt;
    }else{
      this.partyOrBarIWasAtBeforeThePartyOrBarIWasJustAt = this.partyOrBarIWasAt;
      this.partyOrBarIWasAt = this.partyOrBarImAt;
      this.partyOrBarImAt = partyOrBarToSayImAt;
    }
    this.storage.set("partyOrBarIWasAtBeforeThePartyOrBarIWasJustAt",this.partyOrBarIWasAtBeforeThePartyOrBarIWasJustAt);
    this.storage.set("partyOrBarIWasAt",this.partyOrBarIWasAt);
    this.storage.set("partyOrBarImAt", this.partyOrBarImAt);

    Promise.all([this.updateAttendanceToFalseAtOldPartyOrBar(), this.updateAttendanceToTrueAtNewPartyOrBar(), this.clearRatingForLeastRecentlyRatedPartyOrBarIfThisIsTheThirdPartyOrBarIveRated()])
      .then(thePromise => {
        this.events.publish("timeToRefreshMapMarkers");

        this.zone.run(() => {
          if(this.amIStillInvitedToThisParty(this.partyOrBarToSayImAt) == true){
            this.allMyData.thePartyOrBarIAmAt = this.getPartyFromInvitedTo(this.partyOrBarImAt);
          }
          if(this.allMyData.barsCloseToMeMap.has(this.partyOrBarToSayImAt) == true){
            this.allMyData.thePartyOrBarIAmAt = this.allMyData.barsCloseToMeMap.get(this.partyOrBarImAt);
          }
        });
      });
  }

  private clearRatingForLeastRecentlyRatedPartyOrBarIfThisIsTheThirdPartyOrBarIveRated(){
    return new Promise((resolve, reject) => {
      if((this.partyOrBarIWasAtBeforeThePartyOrBarIWasJustAt != null) && 
         (this.partyOrBarIWasAtBeforeThePartyOrBarIWasJustAt != this.partyOrBarIWasAt) &&
         (this.partyOrBarIWasAtBeforeThePartyOrBarIWasJustAt != this.partyOrBarImAt)){
        if(this.amIStillInvitedToThisParty(this.partyOrBarIWasAtBeforeThePartyOrBarIWasJustAt) == true){
          let partyIWasAtBeforeThePartyIWasJustAt = this.getPartyFromInvitedTo(this.partyOrBarIWasAtBeforeThePartyOrBarIWasJustAt);
          this.allMyData.clearRatingForParty(partyIWasAtBeforeThePartyIWasJustAt, this.http)
          .then((res) => {
            resolve(res);
          })
          .catch((err) => {
            this.allMyData.logError(this.analyticsID, "server", "Issue clearing rating for party : Err msg = " + err, this.http);
            resolve(err);
          });
        }
        if(this.allMyData.barsCloseToMeMap.has(this.partyOrBarIWasAtBeforeThePartyOrBarIWasJustAt) == true){
          let barIWasAtBeforeTheBarIWasJustAt = this.allMyData.barsCloseToMeMap.get(this.partyOrBarIWasAtBeforeThePartyOrBarIWasJustAt);
          this.allMyData.clearRatingForBar(barIWasAtBeforeTheBarIWasJustAt, this.http)
          .then((res) => {
            resolve(res);
          })
          .catch((err) => {
            this.allMyData.logError(this.analyticsID, "server", "Issue clearing rating for bar : Err msg = " + err, this.http);
            resolve(err);
          });
        }
      }else{
        resolve("no ratings to get rid of - person did not rate more than 2 parties or bars within 30 minutes");
      }
    });
  }

  createTimerForNotification(howManyMilliSecondsFromNow : number) : NodeJS.Timer{
    return setTimeout(() => {
      LocalNotifications.getPlugin().schedule({
        id: 0,
        foreground: true,
        title: 'Are you at a party or bar?',
        text: 'If so, check in to let others know how it is.'
      });
    }, howManyMilliSecondsFromNow);
  }

  createTimerForUpdatingAttendance(howManyMilliSecondsFromNow : number) : NodeJS.Timer{
    return setTimeout(() => {
      this.updateWhereIAmAt(this.partyOrBarToSayImAt);
    }, howManyMilliSecondsFromNow);
  }

  private updateAttendanceToFalseAtOldPartyOrBar(){
    return new Promise((resolve, reject) => {
      if((this.partyOrBarIWasAt != null) && (this.partyOrBarIWasAt != this.partyOrBarImAt)){
        if(this.amIStillInvitedToThisParty(this.partyOrBarIWasAt) == true){
          let partyIWasAt = this.getPartyFromInvitedTo(this.partyOrBarIWasAt);
          this.allMyData.changeAtPartyStatus(partyIWasAt, false, this.http)
          .then((res) => {
            resolve(res);
          })
          .catch((err) => {
            this.allMyData.logError(this.analyticsID, "server", "Issue changing atParty status : Err msg = " + err, this.http);
            resolve(err);
          });
        }
        if(this.allMyData.barsCloseToMeMap.has(this.partyOrBarIWasAt) == true){
          let barIWasAt = this.allMyData.barsCloseToMeMap.get(this.partyOrBarIWasAt);
          this.allMyData.changeAtBarStatus(barIWasAt, false, this.http)
          .then((res) => {
            resolve(res);
          })
          .catch((err) => {
            this.allMyData.logError(this.analyticsID, "server", "Issue changing atBar status : Err msg = " + err, this.http);
            resolve(err);
          });
        }
      }else{
        resolve("nothing to update: person did not leave a party/bar");
      }
    });
  }

  private updateAttendanceToTrueAtNewPartyOrBar(){
    return new Promise((resolve, reject) => {
      if(this.partyOrBarImAt != null){
        if(this.amIStillInvitedToThisParty(this.partyOrBarImAt) == true){
          let partyImAt = this.getPartyFromInvitedTo(this.partyOrBarImAt);
          this.allMyData.changeAtPartyStatus(partyImAt, true, this.http)
          .then((res) => {
            resolve(res);
          })
          .catch((err) => {
            this.allMyData.logError(this.analyticsID, "server", "Issue changing atParty status : Err msg = " + err, this.http);
            resolve(err);
          });
        }
        if(this.allMyData.barsCloseToMeMap.has(this.partyOrBarImAt) == true){
          let barImAt = this.allMyData.barsCloseToMeMap.get(this.partyOrBarImAt);
          this.allMyData.changeAtBarStatus(barImAt, true, this.http)
          .then((res) => {
            resolve(res);
          })
          .catch((err) => {
            this.allMyData.logError(this.analyticsID, "server", "Issue changing atBar status : Err msg = " + err, this.http);
            resolve(err);
          });
        }
      }else{
        resolve("nothing to update: person did not enter a party/bar");
      }
    });
  }

  getPartyOrBarFromID(id: string){
    if(id == null){
      return null;
    }
    if(this.amIStillInvitedToThisParty(id) == true){
      return this.getPartyFromInvitedTo(id);
    }else{
      return this.allMyData.barsCloseToMeMap.get(id);
    }
  }

  getPartyFromInvitedTo(partyID : string){
    for(let i = 0; i < this.allMyData.invitedTo.length; i++){
      if(this.allMyData.invitedTo[i].partyID == partyID){
        return this.allMyData.invitedTo[i];
      }
    }
    return null;
  }

  getBarFromBarMap(barID : string){
    if(this.allMyData.barsCloseToMeMap.has(barID) == true){
      return this.allMyData.barsCloseToMeMap.get(barID);
    }
    return null;
  }

  amIStillInvitedToThisParty(partyID : string){
    for(let i = 0; i < this.allMyData.invitedTo.length; i++){
      if(this.allMyData.invitedTo[i].partyID == partyID){
        return true;
      }
    }
    return false;
  }

  determineWhenTheFirstNotificationShouldBeTriggered() : Date {
    let tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    let earliestTimeEntered : Date = tomorrow;
    this.mapOfTimeUserEnteredVicinityDistanceOfPartiesAndBars.forEach((timeUserEnteredVicinity: Date, key: string) => {
      if(timeUserEnteredVicinity.getTime() < earliestTimeEntered.getTime()){
        earliestTimeEntered = timeUserEnteredVicinity;
      }
    });
    return earliestTimeEntered;
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
      if(Utility.partyIsCurrentlyInProgress(party)){
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