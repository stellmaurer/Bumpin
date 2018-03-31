/*******************************************************
 * Copyright (C) 2018 Stephen Ellmaurer <stellmaurer@gmail.com>
 * 
 * This file is part of the Bumpin mobile app project.
 * 
 * The Bumpin project and any of the files within the Bumpin
 * project can not be copied and/or distributed without
 * the express permission of Stephen Ellmaurer.
 *******************************************************/

import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController, Events } from 'ionic-angular';
import { Geolocation } from 'ionic-native';
import {Http} from '@angular/http';
import {Party} from "../../model/party";
import {Bar} from "../../model/bar";
import { AllMyData } from "../../model/allMyData";
import { PopoverController } from 'ionic-angular';
import { PartyPopover } from './partyPopover';
import { BarPopover } from './barPopover';
import { LocationTracker } from '../../providers/location-tracker';
import { Utility } from '../../model/utility';
import { AlertController } from 'ionic-angular';
import { Login } from '../login/login';

 
declare var google;

@Component({
  selector: 'page-find',
  templateUrl: 'find.html'
})
export class FindPage {

  private bumpinMarker = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=|32DB64";
  private heatingUpMarker = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=|FFFF00";
  private decentMarker = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=|FFA500";
  private weakMarker = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=|F53D3D";
 
  private tabName: string = "Find Tab";
  @ViewChild('map') mapElement: ElementRef;
  public map: any;

  partyMarkersOnMap : Map<string,any>;
  barMarkersOnMap : Map<string,any>;

  userLocationMarker: any;
  myCoordinates : any;

  geocoder : any;

  private includeBars : boolean;
  private includePartiesToday : boolean;
  private includePartiesThisWeek : boolean;
  private includeAllParties : boolean;
  private includeBarsTemp : boolean;
  private includePartiesTodayTemp : boolean;
  private includePartiesThisWeekTemp : boolean;
  private includeAllPartiesTemp : boolean;
 
  constructor(private allMyData : AllMyData, private login : Login, public alertCtrl: AlertController, public locationTracker: LocationTracker, private events : Events, private http:Http, public navCtrl: NavController, public popoverCtrl: PopoverController) {
    this.allMyData.events = events;
    this.partyMarkersOnMap = new Map<string,any>();
    this.barMarkersOnMap = new Map<string,any>();
    this.locationTracker.startTracking();
    this.includeBars = true;
    this.includePartiesToday = true;
    this.includePartiesThisWeek = true;
    this.includeAllParties = true;
    this.includeBarsTemp = true;
    this.includePartiesTodayTemp = true;
    this.includePartiesThisWeekTemp = true;
    this.includeAllPartiesTemp = true;
  }

  ionViewDidLoad(){
    this.login.login()
    .then((res) => {
      this.setupThePage();
    })
    .catch((err) => {
        // error logging is already done in the Login file
    });
  }

  ionViewWillEnter(){
    this.allMyData.events.publish("timeToRefreshPartyAndBarData");
  }

  private setupThePage(){
    this.loadMap()
    .then((res) => {
      // Start retrieving user location
      this.enableUserLocation();
      // Get bars that are close to me from the database
      this.allMyData.refreshBarsCloseToMe(this.myCoordinates,this.http)
      .then((res) => {
        this.events.publish("updateMyAtBarAndAtPartyStatuses");
        this.refreshBarMarkers();
      })
      .catch((err) => {
        this.allMyData.logError(this.tabName, "server", "refreshBarsCloseToMe query error : Err msg = " + err, this.http);
      });
      // Get parties that I'm invited to from the database
      this.allMyData.refreshParties(this.http)
      .then((res) => {
        this.events.publish("updateMyAtBarAndAtPartyStatuses");
        this.refreshPartyMarkers();
      })
      .catch((err) => {
        this.allMyData.logError(this.tabName, "server", "refreshParties query error : Err msg = " + err, this.http);
      });
    })
    .catch((err) => {
      this.allMyData.logError(this.tabName, "google maps", "issue loading the google map : Err msg = " + err, this.http);
    });

    this.allMyData.refreshPerson(this.http)
    .then((res) => {
      this.allMyData.refreshPartiesImHosting(this.http)
      .then((res) => {
        
      })
      .catch((err) => {
        this.allMyData.logError(this.tabName, "server", "refreshPartiesImHosting query error : Err msg = " + err, this.http);
      });
    })
    .catch((err) => {
      this.allMyData.logError(this.tabName, "server", "refreshPerson query error : Err msg = " + err, this.http);
    });

    this.allMyData.startPeriodicDataRetrieval(this.http);
    this.events.subscribe("timeToRefreshPartyAndBarData",() => {
      this.allMyData.refreshPerson(this.http)
      .then((res) => {
        Promise.all([this.allMyData.refreshBarsCloseToMe(this.myCoordinates, this.http), this.allMyData.refreshParties(this.http)]).then(thePromise => {
          return thePromise;
        })
        .then((res) => {
          this.events.publish("updateMyAtBarAndAtPartyStatuses");
          this.refreshPartyMarkers();
          this.refreshBarMarkers();
        })
        .catch((err) => {
          this.allMyData.logError(this.tabName, "server", "refreshBarsCloseToMe or refreshParties query error : Err msg = " + err, this.http);
        });
      })
      .catch((err) => {
        this.allMyData.logError(this.tabName, "server", "refreshPerson query error : Err msg = " + err, this.http);
      });
    });

    this.events.subscribe("aDifferentUserJustLoggedIn",() => {
      Promise.all([this.allMyData.refreshBarsCloseToMe(this.myCoordinates, this.http), this.allMyData.refreshParties(this.http)]).then(thePromise => {
        return thePromise;
      })
      .then((res) => {
        this.refreshPartyMarkers();
        this.refreshBarMarkers();
      })
      .catch((err) => {
        this.allMyData.logError(this.tabName, "server", "refreshBarsCloseToMe or refreshParties query error : Err msg = " + err, this.http);
      });
    });

    this.events.subscribe("timeToUpdateUI",() => {
        this.updateTheUI();
    });

    this.events.subscribe("timeToRefreshMapMarkers",() => {
      this.refreshMapMarkers();
    });
  }

  private updateTheUI(){
    for(let i = 0; i < this.allMyData.invitedTo.length; i++){
      this.allMyData.invitedTo[i].refreshPartyStats();
    }
    for(let i = 0; i < this.allMyData.barsCloseToMe.length; i++){
      this.allMyData.barsCloseToMe[i].refreshBarStats();
    }
    this.refreshMapMarkers();
  }

  private refreshMapMarkers(){
    this.refreshPartyMarkers();
    this.refreshBarMarkers();
  }

  private enableUserLocation(){
    this.locationTracker.watch
      .subscribe((location) => {
        this.myCoordinates = {lat: this.locationTracker.lat, lng: this.locationTracker.lng}
        this.userLocationMarker.setPosition(this.myCoordinates);
    });
  }
 
  private loadMap(){
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition().then((position) => {
        this.myCoordinates = {lat: position.coords.latitude, lng: position.coords.longitude};
        let latLng = {lat: position.coords.latitude, lng: position.coords.longitude};
  
        let mapOptions = {
          center: latLng,
          zoom: 15,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          zoomControl: false,
          mapTypeControl: false,
          streetViewControl: false,
        }
        
        this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);
        let image = 'assets/greencircle.png';
        this.userLocationMarker = new google.maps.Marker({
          map: this.map,
          position: {lat: position.coords.latitude, lng: position.coords.longitude},
          icon: image
        });
        resolve("the google map has loaded");
      }, (err) => {
        reject(err);
      });
    });
  }

  /*
    First, we need to cleanup any parties that are on the map but are no longer in allMyData.invitedTo.
        This is handled by Case 1.
    All markers can't just be cleared and then re-added because that will interrupt users who
        are interacting with the map. We instead need to check to see if a party already exists
        on the map and update it if it exists, otherwise just add it to the map.
        This is handled by Case 1 and 2.

    Case 1 : cleanup old parties
    Case 2 : this party is on the map
    Case 3 : this party isn't on the map
  */
  private refreshPartyMarkers(){
    var thisInstance = this;
    // Transform party array into a hashmap for quick access in Case 1
    var parties = this.allMyData.invitedTo;
    var partiesMap : Map<string,Party> = new Map<string,Party>();
    for(let i = 0; i < parties.length; i++){
      partiesMap.set(parties[i].partyID, parties[i]);
    }

    // Case 1 : cleanup parties that are on the map but are no longer in allMyData.invitedTo
    this.partyMarkersOnMap.forEach((value: any, key: string) => {
      if(partiesMap.has(key) == false){
        let theMarkerToRemove = this.partyMarkersOnMap.get(key);
        theMarkerToRemove.setMap(null);
        this.partyMarkersOnMap.delete(key);
      }
    });

    // Case 2 and 3
    partiesMap.forEach((value: Party, key: string) => {
      let marker : any;
      // Case 2 : this party is on the map
      if(this.partyMarkersOnMap.has(key) == true){
        marker = this.partyMarkersOnMap.get(key);
        // the party might have new myCoordinates
        var coordinates = {lat: value.latitude, lng: value.longitude};
        marker.setPosition(coordinates);
        marker.setIcon(this.getMarkerIcon(value));
        marker.party = value;
        marker.setLabel(String(value.numberOfPeopleAtParty));
      }
      // Case 3 : this party isn't on the map
      else{
        // Check the filters to see if we should put this marker on the map
        let mapToAttachToMarker = this.map;
        if(this.partyMarkerShouldBeVisible(value) == false){
          mapToAttachToMarker = null;
        }
        marker = new google.maps.Marker({
          map: mapToAttachToMarker,
          animation: google.maps.Animation.DROP,
          position: {lat: value.latitude, lng: value.longitude},
          icon : this.getMarkerIcon(value),
          label : String(value.numberOfPeopleAtParty),
          party : value
        });
        marker.addListener('click', function() {
          thisInstance.presentPartyPopover(this.party);
        });
      }
      this.partyMarkersOnMap.set(key, marker); // update the party markers list with the new party info
    });
  }

  /*
    First, we need to cleanup any bars that are on the map but are no longer in allMyData.invitedTo.
        This is handled by Case 1.
    All markers can't just be cleared and then re-added because that will interrupt users who
        are interacting with the map. We instead need to check to see if a bar already exists
        on the map and update it if it exists, otherwise just add it to the map.
        This is handled by Case 1 and 2.

    Case 1 : cleanup old bars
    Case 2 : this bar is on the map
    Case 3 : this bar isn't on the map
  */
  private refreshBarMarkers(){
    var thisInstance = this;
    // Transform bar array into a hashmap for quick access in Case 1
    var bars = this.allMyData.barsCloseToMe;
    var barsMap : Map<string,Bar> = new Map<string,Bar>();
    for(let i = 0; i < bars.length; i++){
      barsMap.set(bars[i].barID, bars[i]);
    }

    // Case 1 : cleanup bars that are on the map but are no longer in allMyData.invitedTo
    this.barMarkersOnMap.forEach((value: any, key: string) => {
      if(barsMap.has(key) == false){
        let theMarkerToRemove = this.barMarkersOnMap.get(key);
        theMarkerToRemove.setMap(null);
        this.barMarkersOnMap.delete(key);
      }
    });

    // Case 2 and 3
    barsMap.forEach((value: Bar, key: string) => {
      let marker : any;
      // Case 2 : this bar is on the map
      if(this.barMarkersOnMap.has(key) == true){
        marker = this.barMarkersOnMap.get(key);
        // the bar might have new myCoordinates
        let coordinates = {lat: value.latitude, lng: value.longitude};
        marker.setPosition(coordinates);
        marker.setIcon(this.getMarkerIcon(value));
        marker.setLabel(String(value.numberOfPeopleAtBar));
        marker.bar = value;
      }
      // Case 3 : this bar isn't on the map
      else{
        marker = new google.maps.Marker({
          map: this.map,
          animation: google.maps.Animation.DROP,
          position: {lat: value.latitude, lng: value.longitude},
          icon : this.getMarkerIcon(value),
          label: String(value.numberOfPeopleAtBar),
          bar : value
        });
        marker.addListener('click', function() {
          thisInstance.presentBarPopover(this.bar);
        });
      }
      this.barMarkersOnMap.set(key, marker); // update the bar markers list with the new bar info
    });
  }

  private getMarkerIcon(partyOrBar: any): any{
    let iconURL = this.bumpinMarker;
    if(partyOrBar.averageRating == "Heat'n-up"){
      iconURL = this.heatingUpMarker;
    }
    if(partyOrBar.averageRating == "Decent"){
      iconURL = this.decentMarker;
    }
    if(partyOrBar.averageRating == "Weak"){
      iconURL = this.weakMarker;
    }
    let markerIcon = {
      url: iconURL,
      labelOrigin: new google.maps.Point(10,11)
    };
    return markerIcon;
  }

  private presentPartyPopover(party : Party) {
    let popover = this.popoverCtrl.create(PartyPopover, {party:party, allMyData:this.allMyData, http:this.http, navCtrl:this.navCtrl}, {cssClass:'partyPopover.scss'});
    popover.present();
  }

  private presentBarPopover(bar : Bar) {
    let popover = this.popoverCtrl.create(BarPopover, {bar:bar, allMyData:this.allMyData, http:this.http}, {cssClass:'barPopover.scss'});
    popover.present();
  }

  presentAlert() {
    let alert = this.alertCtrl.create();
    alert.setTitle('What do you want to include on the map?');

    alert.addInput({
      type: 'checkbox',
      label: 'Bars',
      checked: this.includeBars,
      handler: data =>  { this.includeBarsTemp = !this.includeBarsTemp;}
    });
    alert.addInput({
      type: 'checkbox',
      label: 'Parties Today',
      checked: this.includePartiesToday,
      handler: data =>  { this.includePartiesTodayTemp = !this.includePartiesTodayTemp;}
    });
    alert.addInput({
      type: 'checkbox',
      label: 'Parties This Week',
      checked: this.includePartiesThisWeek,
      handler: data =>  { this.includePartiesThisWeekTemp = !this.includePartiesThisWeekTemp;}
    });
    alert.addInput({
      type: 'checkbox',
      label: 'All Parties',
      checked: this.includeAllParties,
      handler: data =>  { this.includeAllPartiesTemp = !this.includeAllPartiesTemp;}
    });


    alert.addButton({
      text: 'Cancel',
      handler: data => {
        this.includeBarsTemp = this.includeBars;
        this.includePartiesTodayTemp = this.includePartiesToday;
        this.includePartiesThisWeekTemp = this.includePartiesThisWeek;
        this.includeAllPartiesTemp = this.includeAllParties;
      }
    });
    alert.addButton({
      text: 'Okay',
      handler: data => {
        this.includeBars = this.includeBarsTemp;
        this.includePartiesToday = this.includePartiesTodayTemp;
        this.includePartiesThisWeek = this.includePartiesThisWeekTemp;
        this.includeAllParties = this.includeAllPartiesTemp;
        this.updateMapMarkersVisibility();
      }
    });
    alert.present();
  }

  updateMapMarkersVisibility(){
    if(this.includeBars == true){
      this.showBarMarkers();
    }else{
      this.hideBarMarkers();
    }

    if(this.includeAllParties == true){
      this.showAllPartyMarkers();
    }else if(this.includePartiesThisWeek == true){
      this.showPartyMarkersForThisWeekAndHideEverythingElse();
    }else if(this.includePartiesToday == true){
      this.showPartyMarkersForTodayAndHideEverythingElse();
    }else{
      this.hideAllPartyMarkers();
    }
  }

  partyMarkerShouldBeVisible(party : Party){
    let markerShouldBeVisible = false;
    if(this.includeAllParties == true){
      markerShouldBeVisible = true;
    }else if(this.includePartiesThisWeek == true){
      if(Utility.isPartyThisWeek(party) == true){
        markerShouldBeVisible = true;
      }else{
        markerShouldBeVisible = false;
      }
    }else if(this.includePartiesToday == true){
      if(Utility.isPartyToday(party) == true){
        markerShouldBeVisible = true;
      }else{
        markerShouldBeVisible = false;
      }
    }else{
      markerShouldBeVisible = false;
    }
    return markerShouldBeVisible;
  }

  showPartyMarkersForTodayAndHideEverythingElse(){
    this.partyMarkersOnMap.forEach((value: any, key: string) => {
        let theMarker = this.partyMarkersOnMap.get(key);
        if(Utility.isPartyToday(theMarker.party) == true){
          theMarker.setMap(this.map);
        }else{
          theMarker.setMap(null);
        }
    });
  }

  showPartyMarkersForThisWeekAndHideEverythingElse(){
    this.partyMarkersOnMap.forEach((value: any, key: string) => {
        let theMarker = this.partyMarkersOnMap.get(key);
        if(Utility.isPartyThisWeek(theMarker.party) == true){
          theMarker.setMap(this.map);
        }else{
          theMarker.setMap(null);
        }
    });
  }

  hideAllPartyMarkers(){
    this.partyMarkersOnMap.forEach((value: any, key: string) => {
        let theMarkerToHide = this.partyMarkersOnMap.get(key);
        theMarkerToHide.setMap(null);
    });
  }

  showAllPartyMarkers(){
    this.partyMarkersOnMap.forEach((value: any, key: string) => {
        let theMarkerToShow = this.partyMarkersOnMap.get(key);
        theMarkerToShow.setMap(this.map);
    });
  }

  hideBarMarkers(){
    this.barMarkersOnMap.forEach((value: any, key: string) => {
        let theMarkerToHide = this.barMarkersOnMap.get(key);
        theMarkerToHide.setMap(null);
    });
  }

  showBarMarkers(){
    this.barMarkersOnMap.forEach((value: any, key: string) => {
        let theMarkerToShow = this.barMarkersOnMap.get(key);
        theMarkerToShow.setMap(this.map);
    });
  }
}
