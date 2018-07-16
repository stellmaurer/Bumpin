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
  private attendanceTimer1 : NodeJS.Timer;
  private attendanceTimer2 : NodeJS.Timer;
  private attendanceTimer3 : NodeJS.Timer;
  
 
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
    .then((val : Date) => {
        if((val == null)){
          this.storage.set("userLastCheckedInAt", yesterday);
        }else {
          this.userLastCheckedInAt = val;
        }
    });
    this.storage.get("userIsCheckedIn")
    .then((val : boolean) => {
        if((val == null)){
          this.storage.set("userIsCheckedIn", false);
        }else {
          this.userIsCheckedIn = val;
        }
    });
    this.storage.get("partyUserIsCheckedInTo")
    .then((val : Party) => {
        if((val != null)){
          if(this.allMyData.invitedTo.indexOf(val) >= 0){
            this.partyUserIsCheckedInto = val;
          }else{
            this.partyUserIsCheckedInto = null;
            this.storage.set("partyUserIsCheckedInto", null);
          }
          this.barUserIsCheckedInto = null;
        }
    });
    this.storage.get("barUserIsCheckedInto")
    .then((val : Bar) => {
        if((val != null)){
          if(this.allMyData.barsCloseToMeMap.has(val.barID) == true){
            this.barUserIsCheckedInto = val;
          }else{
            this.barUserIsCheckedInto = null;
            this.storage.set("barUserIsCheckedInto", null);
          }
          this.partyUserIsCheckedInto = null;
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
      this.localNotifications.clearAll();
      clearTimeout(this.attendanceTimer1);
      clearTimeout(this.attendanceTimer2);
      clearTimeout(this.attendanceTimer3);
      
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
          if(this.isUserWithinVicinityDistanceOfThisBarOrParty(this.partyUserIsCheckedInto) == false){
            this.allMyData.changeAtPartyStatus(this.partyUserIsCheckedInto, false, this.http)
            .catch((err) => {
              this.allMyData.logError(this.analyticsID, "server", "Issue changing atParty status : Err msg = " + err, this.http);
            });
            this.userIsCheckedIn = false;
            this.partyUserIsCheckedInto = null;
            this.storage.set("userIsCheckedIn", false);
            this.storage.set("partyUserIsCheckedInto", null);
            shouldUpdateUI = true;
            this.localNotifications.clearAll();
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
                this.attendanceTimer2 = this.createTimerForUpdatingAttendance(this.closestPartyOrBar, 1800000); // 30 min
                this.attendanceTimer3 = this.createTimerForUpdatingAttendance(this.closestPartyOrBar, 3600000); // 60 min
                // send a check-in notification to them (asking them if they are at that closest party to them)
                this.localNotifications.schedule({
                  id: 0,
                  title: 'Are you at ' + (<Party>this.closestPartyOrBar).title + '?',
                  text: 'Time = ' + dateOfLocation.getHours() + ":" + dateOfLocation.getMinutes() + ":" + dateOfLocation.getSeconds()
                });
                let timeToTriggerSecondNotification = new Date().setMinutes(new Date().getMinutes() + 30);
                let timeToTriggerThirdNotification = new Date().setMinutes(new Date().getMinutes() + 60);
                this.localNotifications.schedule({
                  id: 1,
                  title: 'Is ' + (<Bar>this.closestPartyOrBar).name + ' Bumpin?',
                  text: 'Time = ' + dateOfLocation.getHours() + ":" + dateOfLocation.getMinutes() + ":" + dateOfLocation.getSeconds(),
                  at: timeToTriggerSecondNotification
                });
                this.localNotifications.schedule({
                    id: 2,
                    title: 'Is ' + name + ' Bumpin?',
                    text: 'Time = ' + dateOfLocation.getHours() + ":" + dateOfLocation.getMinutes() + ":" + dateOfLocation.getSeconds(),
                    at: timeToTriggerThirdNotification
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
                this.attendanceTimer2 = this.createTimerForUpdatingAttendance(this.closestPartyOrBar, 1800000); // 30 min
                this.attendanceTimer3 = this.createTimerForUpdatingAttendance(this.closestPartyOrBar, 3600000); // 60 min
                // send a check-in notification to them (asking them if they are at that closest bar to them)
                this.localNotifications.schedule({
                  id: 0,
                  title: 'Are you at ' + (<Bar>this.closestPartyOrBar).name + '?',
                  text: 'Time = ' + dateOfLocation.getHours() + ":" + dateOfLocation.getMinutes() + ":" + dateOfLocation.getSeconds()
                });
                let timeToTriggerSecondNotification = new Date().setMinutes(new Date().getMinutes() + 30);
                let timeToTriggerThirdNotification = new Date().setMinutes(new Date().getMinutes() + 60);
                this.localNotifications.schedule({
                  id: 1,
                  title: 'Is ' + (<Bar>this.closestPartyOrBar).name + ' Bumpin?',
                  text: 'Time = ' + dateOfLocation.getHours() + ":" + dateOfLocation.getMinutes() + ":" + dateOfLocation.getSeconds(),
                  at: timeToTriggerSecondNotification
                });
                this.localNotifications.schedule({
                    id: 2,
                    title: 'Is ' + name + ' Bumpin?',
                    text: 'Time = ' + dateOfLocation.getHours() + ":" + dateOfLocation.getMinutes() + ":" + dateOfLocation.getSeconds(),
                    at: timeToTriggerThirdNotification
                });
                notificationHasBeenScheduled = true;
            }
          }else{
            this.mapOfTimeUserEnteredVicinityDistanceOfPartiesAndBars.set(bar.barID, new Date());
          }
        }

      });

      this.zone.run(() => {
        this.allMyData.thePartyOrBarIAmAt = this.closestPartyOrBar;
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
     if(notificationHasBeenScheduled == false){
        let earliestTimeUserEnteredVicinity = this.determineWhenTheFirstNotificationShouldBeTriggered();
        let timeToTriggerFirstNotification = new Date(earliestTimeUserEnteredVicinity);
        timeToTriggerFirstNotification.setMinutes(earliestTimeUserEnteredVicinity.getMinutes() + 5);
        let timeToTriggerSecondNotification = new Date(earliestTimeUserEnteredVicinity);
        timeToTriggerSecondNotification.setMinutes(earliestTimeUserEnteredVicinity.getMinutes() + 30)
        let timeToTriggerThirdNotification = new Date(earliestTimeUserEnteredVicinity);
        timeToTriggerThirdNotification.setMinutes(earliestTimeUserEnteredVicinity.getMinutes() + 60)
        
        let partyOrBarImAt = this.closestPartyOrBar;
        if(this.userIsCheckedIn == true){
          if(this.partyUserIsCheckedInto != null){
            partyOrBarImAt = this.partyUserIsCheckedInto;
          }
          if(this.barUserIsCheckedInto != null){
            partyOrBarImAt = this.barUserIsCheckedInto;
          }
        }
        if(partyOrBarImAt != null){
          this.attendanceTimer1 = this.createTimerForUpdatingAttendance(partyOrBarImAt, timeToTriggerFirstNotification.getTime() - new Date().getTime()); // ~5 min
          this.attendanceTimer2 = this.createTimerForUpdatingAttendance(partyOrBarImAt, timeToTriggerSecondNotification.getTime() - new Date().getTime()); // ~30 min
          this.attendanceTimer3 = this.createTimerForUpdatingAttendance(partyOrBarImAt, timeToTriggerThirdNotification.getTime() - new Date().getTime()); // ~60 min
        }

        let name = "a bar";
        if(this.userIsCheckedIn == true){
          if(this.barUserIsCheckedInto != null){
            name = this.barUserIsCheckedInto.name;
          }else{
            name = this.partyUserIsCheckedInto.title;
          }
        }else{
          if(this.closestPartyOrBar instanceof Party){
            name = this.closestPartyOrBar.title;
          }
          if(this.closestPartyOrBar instanceof Bar){
            name = this.closestPartyOrBar.name;
          }
        }

        if(this.userIsCheckedIn == false){
          if(this.closestPartyOrBar != null){
            this.localNotifications.schedule({
              id: 0,
              title: 'Are you at ' + name + '?',
              text: 'Time = ' + dateOfLocation.getHours() + ":" + dateOfLocation.getMinutes() + ":" + dateOfLocation.getSeconds(),
              at: timeToTriggerFirstNotification
            });
          }
        }

        this.localNotifications.schedule({
            id: 1,
            title: 'Is ' + name + ' Bumpin?',
            text: 'Time = ' + dateOfLocation.getHours() + ":" + dateOfLocation.getMinutes() + ":" + dateOfLocation.getSeconds(),
            at: timeToTriggerSecondNotification
        });
        this.localNotifications.schedule({
            id: 2,
            title: 'Is ' + name + ' Bumpin?',
            text: 'Time = ' + dateOfLocation.getHours() + ":" + dateOfLocation.getMinutes() + ":" + dateOfLocation.getSeconds(),
            at: timeToTriggerThirdNotification
        });
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

  createTimerForUpdatingAttendance(partyOrBarImAt : any, howManyMilliSecondsFromNow : number) : NodeJS.Timer{
    return setTimeout(() => {
      if(partyOrBarImAt instanceof Party){
        this.allMyData.changeAtPartyStatus(partyOrBarImAt, true, this.http)
        .catch((err) => {
          this.allMyData.logError(this.analyticsID, "server", "Issue changing atParty status : Err msg = " + err, this.http);
        });
      }
      if(partyOrBarImAt instanceof Bar){
        this.allMyData.changeAtBarStatus(partyOrBarImAt, true, this.http)
        .catch((err) => {
          this.allMyData.logError(this.analyticsID, "server", "Issue changing atBar status : Err msg = " + err, this.http);
        });
      }
      this.zone.run(() => {
        this.events.publish("timeToUpdateUI");
      });
    }, howManyMilliSecondsFromNow);
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