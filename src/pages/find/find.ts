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
import { NavController, Events, Loading } from 'ionic-angular';
import { Geolocation, Geoposition } from 'ionic-native';
import { Http } from '@angular/http';
import { Party } from "../../model/party";
import { Bar } from "../../model/bar";
import { AllMyData } from "../../model/allMyData";
import { PopoverController } from 'ionic-angular';
import { PartyPopover } from './partyPopover';
import { BarPopover } from './barPopover';
import { LocationTracker } from '../../providers/location-tracker';
import { Utility } from '../../model/utility';
import { AlertController } from 'ionic-angular';
import * as MarkerClusterer from 'node-js-marker-clusterer';
import { Storage } from '@ionic/storage';
import { BackgroundGeolocationResponse } from '@ionic-native/background-geolocation';
import { Diagnostic } from '@ionic-native/diagnostic';
import { HowDidYouHearPopover } from '../login/howDidYouHearPopover';
 
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

  private markerCluster : any;
  private barClusterMarkers : any;
  partyMarkersOnMap : Map<string,any>;
  barMarkersOnMap : Map<string,any>;

  userLocationMarker: any;
  myCoordinates : any;

  geocoder : any;

  private filterDontShowBars : boolean;
  private filterFavorites : boolean;
  private filterAttendance : boolean;
  private filterFriendsPresent : boolean;

  private filterDontShowBarsTemp : boolean;
  private filterFavoritesTemp : boolean;
  private filterAttendanceTemp : boolean;
  private filterFriendsPresentTemp : boolean;

  private numberOfActiveFilters : number;

  private currentlyLoadingData : boolean;
  private usersActualCoordinatesHaveBeenSet : boolean;
  private numberOfTutorialStepsCompleted : number;
  private overlayIsActive : boolean;
  private mapExplanationIsActive : boolean;
  private upperleftButtonExplanationIsActive : boolean;
  private upperRightButtonExplanationIsActive : boolean;
  private bottomRightButtonExplanationIsActive : boolean;
  private tabsExplanationIsActive : boolean;

  private numberOfBarsCurrentlyBeingShownOnMap : number;
 
  constructor(private diagnostic: Diagnostic, private allMyData : AllMyData, private storage: Storage, public alertCtrl: AlertController, public locationTracker: LocationTracker, private events : Events, private http:Http, public navCtrl: NavController, public popoverCtrl: PopoverController) {
    this.overlayIsActive = false;
    this.mapExplanationIsActive = false;
    this.upperleftButtonExplanationIsActive = false;
    this.upperRightButtonExplanationIsActive = false;
    this.bottomRightButtonExplanationIsActive = false;
    this.tabsExplanationIsActive = false;
    this.allMyData.events = events;
    this.partyMarkersOnMap = new Map<string,any>();
    this.barMarkersOnMap = new Map<string,any>();
    this.numberOfBarsCurrentlyBeingShownOnMap = 0;

    this.filterDontShowBars = false;
    this.filterFavorites = false;
    this.filterAttendance = false;
    this.filterFriendsPresent = false;

    this.filterDontShowBarsTemp = false;
    this.filterFavorites = false;
    this.filterAttendanceTemp = false;
    this.filterFriendsPresentTemp = false;

    this.numberOfActiveFilters = 0;

    this.currentlyLoadingData = false;

    this.usersActualCoordinatesHaveBeenSet = false;
    
    this.events.subscribe("tabBarWasClicked",() => {
      if(this.numberOfTutorialStepsCompleted == 4){
        this.overlayWasClicked();
      }
    });

    
    this.storage.get("usersActualCoordinatesHaveBeenSet")
    .then((val : boolean) => {
        if((val == null)){
          this.storage.set("usersActualCoordinatesHaveBeenSet", false);
        }else {
          this.usersActualCoordinatesHaveBeenSet = val;
        }
    });

    this.populateFiltersFromLocalDataStorage();

    this.barClusterMarkers = new Array<any>();

    this.initializePartyAndBarDataFromLocalDataStorage();
    
    this.numberOfTutorialStepsCompleted = 5;

    this.storage.get("numberOfTutorialStepsCompletedFindTab")
    .then((val : number) => {
        if((val == null)){
          this.numberOfTutorialStepsCompleted = 0;
          this.storage.set("numberOfTutorialStepsCompletedFindTab", 0);
          this.overlayIsNowActive();
        }else {
          this.numberOfTutorialStepsCompleted = val;
          if(this.numberOfTutorialStepsCompleted != 5){
            this.overlayIsNowActive();
          }
        }
    });

    this.events.subscribe("howDidYouHearPopoverDismissed",() => {
      if(this.numberOfTutorialStepsCompleted >= 5){
        this.overlayIsNowInactive();
      }
    });
  }

  ionViewDidLoad(){
    
    this.allMyData.storage.get("whatGotPersonToDownload")
    .then((val : string) => {
      if((val == null)){
        this.presentHowDidYouHearPopover();
      }
    });
    
    this.setupThePage();
  }

  ionViewWillEnter(){
    if(this.numberOfTutorialStepsCompleted != 5){
      this.overlayIsNowActive();
    }
    this.allMyData.refreshDataAndResetPeriodicDataRetrievalTimer(this.http);
  }

  ionViewWillLeave(){
    this.overlayIsNowInactive();
  }

  private initializePartyAndBarDataFromLocalDataStorage(){
    Promise.all([this.allMyData.initializeBarsCloseToMeFromLocalDataStorage(this.tabName, this.http), 
                 this.allMyData.initializeBarsImHostingFromLocalDataStorage(this.tabName, this.http),
                 this.allMyData.initializePartiesImInvitedToFromLocalDataStorage(this.tabName, this.http),
                 this.allMyData.initializePartiesImHostingFromLocalDataStorage(this.tabName, this.http)])
    .then(thePromise => {
      this.refreshPartyMarkers();
      this.refreshBarMarkers();
    });
  }

  private setupThePage(){
    this.loadMap()
    .then((res) => {
      this.addCenterControlToMap();
    })
    .catch((err) => {
      this.allMyData.logError(this.tabName, "google maps", "issue loading the google map : Err msg = " + err, this.http);
    });

    this.events.subscribe("timeToRefreshPartyAndBarData",() => {
      this.refreshPartyAndBarDataOnceFacebookIDAndLocationAreSet();
    });

    this.events.subscribe("timeToUpdateUserLocation", () => {
      this.myCoordinates = {lat: this.locationTracker.lat, lng: this.locationTracker.lng};
      if(this.userLocationMarker !== undefined){
        this.userLocationMarker.setPosition(this.myCoordinates);
      }

      // This makes it so the user can enable location at any time and see immediate changes to the map
      if((this.usersActualCoordinatesHaveBeenSet == false) && (this.map !== undefined)){
        this.usersActualCoordinatesHaveBeenSet = true;
        this.allMyData.refreshDataAndResetPeriodicDataRetrievalTimer(this.http);
        this.map.setCenter(this.myCoordinates);
        this.map.setZoom(15);
      }
    });

    this.events.subscribe("timeToUpdateUI",() => {
        this.updateTheUI();
    });

    this.events.subscribe("timeToRefreshMapMarkers",() => {
      this.refreshMapMarkers();
    });

    this.events.subscribe("timeToUpdateBarMarkersVisibility",() => {
      this.updateBarMarkersVisibility();
    });
  }

  private refreshPartyAndBarDataOnceFacebookIDAndLocationAreSet(){
    this.currentlyLoadingData = true;
    if(this.allMyData.me.facebookID == "Not yet set." || this.myCoordinates === undefined){
      let timer = setInterval(() => {
        if((this.allMyData.me.facebookID != "Not yet set.") && (this.myCoordinates !== undefined)){
          clearInterval(timer);
          this.refreshPartyAndBarData()
          .then((res) => {
            this.currentlyLoadingData = false;
          })
          .catch((err) => {
            this.currentlyLoadingData = false;
          });
        }
      }, 250);
    }else{
      this.refreshPartyAndBarData()
      .then((res) => {
        this.currentlyLoadingData = false;
      })
      .catch((err) => {
        this.currentlyLoadingData = false;
      });
    }
  }

  private refreshPartyAndBarData(){
    return new Promise((resolve, reject) => {
      this.allMyData.refreshPerson(this.http)
      .then((res) => {
        Promise.all([this.allMyData.refreshBarsCloseToMe(this.myCoordinates, this.http), this.allMyData.refreshBarsImHosting(this.http), this.allMyData.refreshParties(this.http), this.allMyData.refreshPartiesImHosting(this.http)]).then(thePromise => {
          return thePromise;
        })
        .then((res) => {
          this.refreshPartyMarkers();
          this.refreshBarMarkers();
          this.updateMyGoingOutStatusIfNeeded();
          this.allMyData.storage.get('partyIDForPushNotification')
          .then((partyID : any) => {
            if(partyID != null){
              let theParty = this.partyMarkersOnMap.get(partyID).party;
              this.allMyData.storage.remove('partyIDForPushNotification');
              this.map.panTo(this.partyMarkersOnMap.get(partyID).getPosition());
              this.presentPartyPopover(theParty);
            }
          });
          resolve("refreshedPartyAndBarData");
        })
        .catch((err) => {
          this.allMyData.logError(this.tabName, "server", "refreshBarsCloseToMe or refreshParties query error : Err msg = " + err, this.http);
          reject("refreshingPartyAndBarData failed. Err: " + err);
        });
      })
      .catch((err) => {
        reject("refreshingPartyAndBarData failed due to refreshPerson. Err: " + err);
        this.allMyData.logError(this.tabName, "server", "refreshPerson query error : Err msg = " + err, this.http);
      });
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

  private changeMyGoingOutStatus(){
    let newStatus = "Unknown";
    if(this.allMyData.me.status.get("goingOut") == "Yes"){
      newStatus = "No";
    }else{
      newStatus = "Yes";
    }
    this.allMyData.changeMyGoingOutStatus(newStatus, "Yes", this.http)
    .then((res) => {
        
    })
    .catch((err) => {
        this.allMyData.logError(this.tabName, "server", "changeMyGoingOutStatus query error : Err msg = " + err, this.http);
    });
  }
 
  private loadMap(){
    return new Promise((resolve, reject) => {
      this.diagnostic.isLocationAuthorized()
      .then((isLocationAuthorized : boolean) => {
        if(isLocationAuthorized == true){
          Geolocation.getCurrentPosition().then((position) => {
            this.myCoordinates = {lat: position.coords.latitude, lng: position.coords.longitude};
            this.setUpMapWithMyCoordinates(this.myCoordinates);
            resolve("the google map has loaded");
          }, (err) => {
            this.myCoordinates = {lat: 40.082064, lng: -97.390820};
            this.setUpMapWithGenericCoordinates(this.myCoordinates);
            resolve("the google map has loaded after an error: " + err + 
            ". This probably was caused by the user not allowing the app to use their location.");
          });
        }else{
          this.myCoordinates = {lat: 40.082064, lng: -97.390820};
          this.setUpMapWithGenericCoordinates(this.myCoordinates);
          resolve("the google map has loaded");
        }
      }).catch((err) => {
        this.myCoordinates = {lat: 40.082064, lng: -97.390820};
        this.setUpMapWithGenericCoordinates(this.myCoordinates);
        this.allMyData.logError(this.tabName, "client", "checkLocationPermissions error : Err msg = " + err, this.http);
        resolve("the google map has loaded");
      });
      
    });
  }

  private setUpMapWithMyCoordinates(coordinates : any){
      let mapOptions = {
        center: coordinates,
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        scaleControl: false
      }
      
      this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);
      let image = 'assets/greencircle.png';
      this.userLocationMarker = new google.maps.Marker({
        map: this.map,
        position: coordinates,
        icon: image
      });
      this.markerCluster = new MarkerClusterer(this.map, [], {imagePath: 'assets/m', maxZoom: 14});
  }

  private setUpMapWithGenericCoordinates(coordinates : any){
    let mapOptions = {
      center: coordinates,
      zoom: 3,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      zoomControl: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      scaleControl: false
    }
    
    this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);
    let image = 'assets/greencircle.png';
    this.userLocationMarker = new google.maps.Marker({
      map: this.map,
      position: coordinates,
      icon: image
    });
    this.markerCluster = new MarkerClusterer(this.map, [], {imagePath: 'assets/m', maxZoom: 14});
  }

  private addCenterControlToMap() {
    var controlDiv = document.getElementById('locateControl');
    let tempThis = this;
    controlDiv.addEventListener('click', function() {
      tempThis.map.setCenter(tempThis.myCoordinates);
      tempThis.map.setZoom(15);
    });
    this.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(controlDiv);
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
        marker = new google.maps.Marker({
          map: this.map,
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

    this.updateMapMarkersVisibility();
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
    bars = this.allMyData.barHostFor;
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
          map: null, // need to set the map to null here because the marker clusterer takes care of that
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

    /*
    this.barClusterMarkers = new Array<any>();
    this.barMarkersOnMap.forEach((value: any, key: string) => {
      let theMarkerToHide = this.barMarkersOnMap.get(key);
      theMarkerToHide.setMap(null);
      this.barClusterMarkers.push(theMarkerToHide);
    });
    this.markerCluster.clearMarkers();
    this.markerCluster.addMarkers(this.barClusterMarkers);
    */
    this.updateMapMarkersVisibility();
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

  private presentHowDidYouHearPopover() {
    this.overlayIsActive = true;
    this.events.publish("overlayIsNowActive");
    let popover = this.popoverCtrl.create(HowDidYouHearPopover, {allMyData:this.allMyData, http:this.http, navCtrl:this.navCtrl, alertCtrl:this.alertCtrl}, {cssClass:'howDidYouHear.scss', enableBackdropDismiss: false});
    popover.present();
  }

  private presentPartyPopover(party : Party) {
    let popover = this.popoverCtrl.create(PartyPopover, {party:party, allMyData:this.allMyData, locationTracker:this.locationTracker, http:this.http, navCtrl:this.navCtrl}, {cssClass:'partyPopover.scss'});
    popover.present();
  }

  private presentBarPopover(bar : Bar) {
    let popover = this.popoverCtrl.create(BarPopover, {bar:bar, allMyData:this.allMyData, locationTracker:this.locationTracker, http:this.http, navCtrl:this.navCtrl}, {cssClass:'barPopover.scss'});
    popover.present();
  }

  presentFilterAlert() {
    let alert = this.alertCtrl.create();
    alert.setTitle('Filter parties or bars on the map with these options.');

    alert.addInput({
      type: 'checkbox',
      label: "No bars",
      checked: this.filterDontShowBars,
      handler: data =>  { this.filterDontShowBarsTemp = !this.filterDontShowBarsTemp;}
    });
    alert.addInput({
      type: 'checkbox',
      label: "Favorites",
      checked: this.filterFavorites,
      handler: data =>  { this.filterFavoritesTemp = !this.filterFavoritesTemp;}
    });
    alert.addInput({
      type: 'checkbox',
      label: 'People present',
      checked: this.filterAttendance,
      handler: data =>  { this.filterAttendanceTemp = !this.filterAttendanceTemp;}
    });
    alert.addInput({
      type: 'checkbox',
      label: 'Friends present',
      checked: this.filterFriendsPresent,
      handler: data =>  { this.filterFriendsPresentTemp = !this.filterFriendsPresentTemp;}
    });

    alert.addButton({
      text: 'Cancel',
      handler: data => {
        this.filterDontShowBarsTemp = this.filterDontShowBars;
        this.filterFavoritesTemp = this.filterFavorites;
        this.filterAttendanceTemp = this.filterAttendance;
        this.filterFriendsPresentTemp = this.filterFriendsPresent;
      }
    });
    alert.addButton({
      text: 'Okay',
      handler: data => {
        this.filterDontShowBars = this.filterDontShowBarsTemp;
        this.filterFavorites = this.filterFavoritesTemp;
        this.filterAttendance = this.filterAttendanceTemp;
        this.filterFriendsPresent = this.filterFriendsPresentTemp;
        this.updateNumberOfActiveFilters();
        this.storeFiltersInLocalDataStorage();
        this.updateMapMarkersVisibility();
      }
    });
    alert.present();
  }

  private updateMarkerClusterZoomLevel(){
    if(this.numberOfBarsCurrentlyBeingShownOnMap <= 50){
      this.markerCluster.setMaxZoom(9);
    }else{
      this.markerCluster.setMaxZoom(14);
    }
  }

  private updateNumberOfActiveFilters(){
    this.numberOfActiveFilters = 0;
    if(this.filterDontShowBars){
      this.numberOfActiveFilters++;
    }
    if(this.filterFavorites){
      this.numberOfActiveFilters++;
    }
    if(this.filterAttendance){
      this.numberOfActiveFilters++;
    }
    if(this.filterFriendsPresent){
      this.numberOfActiveFilters++;
    }
  }

  private storeFiltersInLocalDataStorage(){
    this.storage.set('filterDontShowBars', this.filterDontShowBars);
    this.storage.set('filterFavorites', this.filterFavorites);
    this.storage.set('filterAttendance', this.filterAttendance);
    this.storage.set('filterFriendsPresent', this.filterFriendsPresent);
  }

  private populateFiltersFromLocalDataStorage(){
    return new Promise((resolve, reject) => {
      Promise.all([this.getFilterFromLocalDataStorage('filterDontShowBars'),
                  this.getFilterFromLocalDataStorage('filterFavorites'),
                  this.getFilterFromLocalDataStorage('filterAttendance'),
                  this.getFilterFromLocalDataStorage('filterFriendsPresent')
                  ]).then(filters => {
        this.filterDontShowBars = filters[0];
        this.filterFavorites = filters[1];
        this.filterAttendance = filters[2];
        this.filterFriendsPresent = filters[3];

        this.filterDontShowBarsTemp = filters[0];
        this.filterFavoritesTemp = filters[1];
        this.filterAttendanceTemp = filters[2];
        this.filterFriendsPresentTemp = filters[3];

        this.updateNumberOfActiveFilters();

        resolve("populating filters from local data storage was successful");
      });
    });
  }

  private getFilterFromLocalDataStorage(filter : string) : Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.storage.get(filter)
      .then((val) => {
        if((val == null) || (val == false)){
          resolve(false);
        }else {
          resolve(true);
        }
      })
      .catch((err) => {
        this.allMyData.logError(this.tabName, "client", "issue retrieving filter from local data storage : Err msg = " + err, this.http);
        resolve(false);
      });
    });
  }

  updateMapMarkersVisibility(){
    this.updateBarMarkersVisibility();
    this.updatePartyMarkersVisibility();
  }

  updateBarMarkersVisibility(){
    this.markerCluster.clearMarkers();

    let barMarkersToShow = new Array<any>();
    this.numberOfBarsCurrentlyBeingShownOnMap = 0;

    this.barMarkersOnMap.forEach((value: any, key: string) => {
      let barMarker = this.barMarkersOnMap.get(key);
      let bar : Bar = barMarker.bar;

      let barShouldBeShown = true;
      if(this.filterDontShowBars == true){
        barShouldBeShown = false;
      }
      if(this.filterFavorites == true){
        if(this.allMyData.favoriteBars.indexOf(bar.barID) == -1){
          barShouldBeShown = false;
        }
      }
      if(this.filterAttendance == true){
        if(bar.numberOfPeopleAtBar < 1){
          barShouldBeShown = false;
        }
      }
      if(this.filterFriendsPresent == true){
        if(this.isAFriendPresentAtThisBar(bar) == false){
          barShouldBeShown = false
        }
      }

      if(barShouldBeShown == true){
        barMarkersToShow.push(barMarker);
        this.numberOfBarsCurrentlyBeingShownOnMap++;
      }
    });

    this.updateMarkerClusterZoomLevel();

    this.markerCluster.addMarkers(barMarkersToShow);
  }

  isAFriendPresentAtThisBar(bar : Bar) : boolean {
    for(let i = 0; i < this.allMyData.friends.length; i++){
      if(bar.attendees.has(this.allMyData.friends[i].facebookID) == true){
        let attendee = bar.attendees.get(this.allMyData.friends[i].facebookID);
        var attendanceIsExpired = Utility.isAttendanceExpired(attendee.timeOfLastKnownLocation);
        if(attendee.atBar && (attendanceIsExpired == false)){
          return true;
        }
      }
    }
    return false;
  }

  isAFriendPresentAtThisParty(party : Party) : boolean {
    for(let i = 0; i < this.allMyData.friends.length; i++){
      if(party.invitees.has(this.allMyData.friends[i].facebookID) == true){
        let invitee = party.invitees.get(this.allMyData.friends[i].facebookID);
        var attendanceIsExpired = Utility.isAttendanceExpired(invitee.timeOfLastKnownLocation);
        if(invitee.atParty && (attendanceIsExpired == false)){
          return true;
        }
      }
    }
    return false;
  }

  updatePartyMarkersVisibility(){
    this.partyMarkersOnMap.forEach((value: any, key: string) => {
      let partyMarker = this.partyMarkersOnMap.get(key);
      let party : Party = partyMarker.party;

      let partyShouldBeShown = true;
      if(this.filterAttendance == true){
        if(party.numberOfPeopleAtParty < 1){
          partyShouldBeShown = false;
        }
      }
      if(this.filterFriendsPresent == true){
        if(this.isAFriendPresentAtThisParty(party) == false){
          partyShouldBeShown = false
        }
      }

      if(partyShouldBeShown == true){
        partyMarker.setMap(this.map);
      }else{
        partyMarker.setMap(null);
      }
    });
  }

  private updateMyGoingOutStatusIfNeeded(){
    let overallStatusNumber = 0;
    if(this.allMyData.me.status.get("manuallySet") == "No"){
      for(let i = 0; i < this.allMyData.barsCloseToMe.length; i++){
        if(this.allMyData.barsCloseToMe[i].attendees.has(this.allMyData.me.facebookID)){
          let myAttendeeInfo = this.allMyData.barsCloseToMe[i].attendees.get(this.allMyData.me.facebookID);
          let statusNumber = this.getStatusNumber(myAttendeeInfo.status);
          if(statusNumber > overallStatusNumber){
            overallStatusNumber = statusNumber;
          }
        }
      }

      for(let i = 0; i < this.allMyData.barHostFor.length; i++){
        if(this.allMyData.barHostFor[i].attendees.has(this.allMyData.me.facebookID)){
          let myAttendeeInfo = this.allMyData.barHostFor[i].attendees.get(this.allMyData.me.facebookID);
          let statusNumber = this.getStatusNumber(myAttendeeInfo.status);
          if(statusNumber > overallStatusNumber){
            overallStatusNumber = statusNumber;
          }
        }
      }

      for(let i = 0; i < this.allMyData.invitedTo.length; i++){
        if(this.allMyData.invitedTo[i].invitees.has(this.allMyData.me.facebookID)){
          let myInviteeInfo = this.allMyData.invitedTo[i].invitees.get(this.allMyData.me.facebookID);
          let statusNumber = this.getStatusNumber(myInviteeInfo.status);
          if(statusNumber > overallStatusNumber){
            overallStatusNumber = statusNumber;
          }
        }
      }

      let oldStatusNumber = this.getStatusNumber(this.allMyData.me.status.get("goingOut"));
      let newStatusNumber = overallStatusNumber;
      if(newStatusNumber > oldStatusNumber){
        let newStatus = this.getStatusFromStatusNumber(newStatusNumber);
        let manuallySet = "No";
        this.allMyData.changeMyGoingOutStatus(newStatus, manuallySet, this.http)
        .then((res) => {
          
        })
        .catch((err) => {
          this.allMyData.logError(this.tabName, "server", "changeMyGoingOutStatus query error : Err msg = " + err, this.http);
        });
      }

    }
  }

  // 0 = Unknown
  // 1 = No
  // 2 = Convince Me
  // 3 = Maybe
  // 4 = Yes
  private getStatusNumber(status : string) : number {
    let statusNumber = 0;
    switch(status){
      case "Unknown": {
        statusNumber = 0;
        break;
      }
      case "No": {
        statusNumber = 1;
        break;
      }
      case "Convince Me": {
        statusNumber = 2;
        break;
      }
      case "Maybe": {
        statusNumber = 3;
        break;
      }
      case "Yes": {
        statusNumber = 4;
        break;
      }
      case "Going": {
        statusNumber = 4;
        break;
      }
    }
    return statusNumber;
  }

  private getStatusFromStatusNumber(statusNumber : number) : string {
    let status = "Unknown";
    switch(statusNumber){
      case 0: {
        status = "Unknown";
        break;
      }
      case 1: {
        status = "No";
        break;
      }
      case 2: {
        status = "Convince Me";
        break;
      }
      case 3: {
        status = "Maybe";
        break;
      }
      case 4: {
        status = "Yes";
        break;
      }
    }
    return status;
  }

  overlayIsNowActive(){
    this.overlayIsActive = true;
    this.events.publish("overlayIsNowActive");
    this.determineWhichTutorialStepToShow();
  }

  overlayIsNowInactive(){
    this.overlayIsActive = false;
    this.events.publish("overlayIsNowInactive");
  }

  determineWhichTutorialStepToShow(){
    if(this.numberOfTutorialStepsCompleted == 0){
      this.mapExplanationIsActive = true;
    }
    if(this.numberOfTutorialStepsCompleted == 1){
      this.upperleftButtonExplanationIsActive = true;
    }
    if(this.numberOfTutorialStepsCompleted == 2){
      this.upperRightButtonExplanationIsActive = true;
    }
    if(this.numberOfTutorialStepsCompleted == 3){
      this.bottomRightButtonExplanationIsActive = true;
    }
    if(this.numberOfTutorialStepsCompleted == 4){
      this.tabsExplanationIsActive = true;
    }
  }

  overlayWasClicked(){
    this.numberOfTutorialStepsCompleted++;
    this.storage.set("numberOfTutorialStepsCompletedFindTab", this.numberOfTutorialStepsCompleted);

    this.mapExplanationIsActive = false;
    this.upperleftButtonExplanationIsActive = false;
    this.upperRightButtonExplanationIsActive = false;
    this.bottomRightButtonExplanationIsActive = false;
    this.tabsExplanationIsActive = false;

    if(this.numberOfTutorialStepsCompleted == 1){
      this.upperleftButtonExplanationIsActive = true;
    }
    if(this.numberOfTutorialStepsCompleted == 2){
      this.upperRightButtonExplanationIsActive = true;
    }
    if(this.numberOfTutorialStepsCompleted == 3){
      this.bottomRightButtonExplanationIsActive = true;
    }
    if(this.numberOfTutorialStepsCompleted == 4){
      this.tabsExplanationIsActive = true;
    }
    if(this.numberOfTutorialStepsCompleted == 5){
      this.mapExplanationIsActive = false;
      this.upperleftButtonExplanationIsActive = false;
      this.upperRightButtonExplanationIsActive = false;
      this.bottomRightButtonExplanationIsActive = false;
      this.overlayIsNowInactive();
    }
  }

}
