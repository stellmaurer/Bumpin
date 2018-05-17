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
import { Http } from '@angular/http';
import { NavParams, NavController, AlertController} from 'ionic-angular';
import { AllMyData} from '../../model/allMyData';
import { Bar, Host } from '../../model/bar';
import { Geolocation } from 'ionic-native';
import { EditHostListPage } from './editHostList';

declare var google;

@Component({
  selector: 'page-editBar',
  templateUrl: 'editBar.html'
})
export class EditBarPage {

  private tabName: string = "Host Tab";
  @ViewChild('map') mapElement: ElementRef;
  public map: any;
  geocoder : any;
  private myLocationMarker : any;
  private originalBar : Bar;
  private bar : Bar;
  private hostsToAdd : Map<string,Host>;
  private hostsToRemove : Map<string,Host>;
  private barMarker : any;
  private inputError : string;
  private daysOfTheWeek : string[] = [ "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday" ];

  constructor(public allMyData : AllMyData, private http:Http, private navCtrl: NavController, params : NavParams, public alertCtrl: AlertController) {
    this.originalBar = params.get("bar");
    this.bar = this.originalBar.createShallowCopy();
    this.hostsToAdd = new Map<string,Host>();
    this.hostsToRemove = new Map<string,Host>();
  }

  ionViewWillLeave(){
    
  }

  ionViewDidLoad(){
    this.loadMap()
    .then((res) => {
      this.updateMapMarker();
    })
    .catch((err) => {
      this.allMyData.logError(this.tabName, "google maps", "getCurrentPosition error: Err msg = " + err, this.http);
    });
  }

  private loadMap(){
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition().then((position) => {
        let latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
  
        let mapOptions = {
          center: latLng,
          zoom: 15,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          zoomControl: false,
          mapTypeControl: false,
          streetViewControl: true,
        }
        this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);

        this.barMarker = new google.maps.Marker({ // just for initialization
          map: null,
          position: latLng,
        });

        var image = 'assets/greencircle.png';
        this.myLocationMarker = new google.maps.Marker({
            map: this.map,
            position: latLng,
            icon: image
        });

        this.geocoder = new google.maps.Geocoder();
        resolve("the google map has loaded");
      }, (err) => {
        // User probably didn't allow the app permission to access their location
        let latLng = new google.maps.LatLng(40.082064, -97.390820);

        let mapOptions = {
          center: latLng,
          zoom: 3,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          zoomControl: false,
          mapTypeControl: false,
          streetViewControl: true,
        }
        
        this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);

        this.barMarker = new google.maps.Marker({ // just for initialization
          map: null,
          position: latLng,
        });

        this.geocoder = new google.maps.Geocoder();
        resolve("the google map has loaded after an error: " + err + 
        ". This probably was caused by the user not allowing the app to use their location.");
      });
    });
  }

  private updateMapMarker(){
    this.codeAddress(this.bar.address);
  }

  private codeAddress(address : string) {
    let tempThis = this;
    this.geocoder.geocode( { 'address': address}, function(results, status) {
      if (status == 'OK') {
        tempThis.map.setCenter(results[0].geometry.location);
        var image = 'assets/darkgreen_MarkerP.png';
        tempThis.barMarker.setMap(null);
        tempThis.barMarker = new google.maps.Marker({
            map: tempThis.map,
            position: results[0].geometry.location,
            icon: image
        });
        tempThis.bar.latitude = Number.parseFloat(results[0].geometry.location.lat());
        tempThis.bar.longitude = Number.parseFloat(results[0].geometry.location.lng());
      } else {
        tempThis.barMarker.setMap(null);
        tempThis.bar.latitude = 1000; // represents the address being faulty
        tempThis.bar.longitude = 1000; // represents the address being faulty
      }
    });
  }

  private stopHostingButtonClicked(){
    this.showStopHostingBarAlert();
  }

  private editHostsButtonClicked(){
    this.navCtrl.push(EditHostListPage, {bar:this.bar}, {animate: false});
  }

  private deleteButtonClicked(){
      this.showDeleteBarAlert();
  }

  private saveButtonClicked(){
    this.validateEditBarInput();
    if(this.inputError == ""){
        this.determineWhichHostsWereAddedAndWhichWereRemoved();
        this.allMyData.editBar(this.bar, this.hostsToAdd, this.hostsToRemove, this.http)
        .then((res) => {
          this.updateMyLocalDataToEnsureUserSeesChanges();
          this.navCtrl.popTo(this.navCtrl.getByIndex(this.navCtrl.length()-3));
        })
        .catch((err) => {
            this.inputError = "An error occurred - please try editing the bar again.";
            this.showEditBarErrorAlert();
            this.allMyData.logError(this.tabName, "server", "editBar query error: Err msg = " + err, this.http);
        });
    }else{
      this.showEditBarErrorAlert();
    }
  }

  private updateMyLocalDataToEnsureUserSeesChanges(){
    // If the user has a bad internet connection, data might not appear changed, but
    //    with this, it will appear changed.
    for(let i = 0; i < this.allMyData.barsCloseToMe.length; i++){
      if(this.allMyData.barsCloseToMe[i].barID == this.bar.barID){
        this.allMyData.barsCloseToMe[i] = this.bar;
        break;
      }
    }
    for(let i = 0; i < this.allMyData.barHostFor.length; i++){
      if(this.allMyData.barHostFor[i].barID == this.bar.barID){
        this.allMyData.barHostFor[i] = this.bar;
        break;
      }
    }
  }

  private determineWhichHostsWereAddedAndWhichWereRemoved(){
    this.originalBar.hosts.forEach((value: any, key: string) => {
        if(this.bar.hosts.has(key) == false){
            // person is in the old list but not the new, so they should be in the list to remove
            this.hostsToRemove.set(key, value);
        }else{
          // person is in the old list and the new (happens if the friend declined to host the party, but then
          //    you reinvited them to host the party)
          let oldHostObject = <Host>value;
          let newHostObject = this.bar.hosts.get(key);
          if(oldHostObject.status == "Declined" && newHostObject.status == "Waiting"){
            this.hostsToAdd.set(key, newHostObject);
          }
        }
    });
    this.bar.hosts.forEach((value: any, key: string) => {
        if(this.originalBar.hosts.has(key) == false){
            // person is in the new list but not the old, so they should be in the list to add
            this.hostsToAdd.set(key, value);
        }
    });
  }

  private validateEditBarInput(){
    this.inputError = "";
    if(this.bar.name == ""){
      this.inputError = "Please give the bar a name.";
    }
    if(this.bar.details == ""){
      this.inputError = "Please enter some details about the bar.";
    }
    if(this.bar.phoneNumber == ""){
      this.inputError = "Please enter a phone number for the bar.";
    }
    if(this.bar.schedule.get("Monday").open == "" ||
       this.bar.schedule.get("Tuesday").open == "" ||
       this.bar.schedule.get("Wednesday").open == "" ||
       this.bar.schedule.get("Thursday").open == "" ||
       this.bar.schedule.get("Friday").open == "" ||
       this.bar.schedule.get("Saturday").open == "" || 
       this.bar.schedule.get("Sunday").open == ""){
       this.inputError = "Please enter operating hours for every day of the week."
    }
  }

  private showEditBarErrorAlert() {
    let alert = this.alertCtrl.create({
      title: 'Error!',
      subTitle: this.inputError,
      buttons: ['OK']
    });
    alert.present();
  }

  private showDeleteBarAlert() {
    let alert = this.alertCtrl.create({
      title: 'Are you sure you want to delete this bar?'
    });
    alert.addButton({
        text: 'No',
        handler: data => {
            
        }
    });
    alert.addButton({
        text: 'Yes',
        handler: data => {
            this.allMyData.deleteBar(this.bar, this.http)
            .then((res) => {
                this.removeTheDeletedBarLocally();
                this.navCtrl.popTo(this.navCtrl.getByIndex(this.navCtrl.length()-3));
            })
            .catch((err) => {
                this.inputError = "An error occurred - please try deleting the bar again.";
                this.showEditBarErrorAlert();
                this.allMyData.logError(this.tabName, "server", "deleteBar query error: Err msg = " + err, this.http);
            });
        }
    });
    alert.present();
  }

  private showStopHostingBarAlert() {
    let alert = this.alertCtrl.create({
      title: 'Are you sure you want to stop hosting this bar?'
    });
    alert.addButton({
        text: 'No',
        handler: data => {
            
        }
    });
    alert.addButton({
        text: 'Yes',
        handler: data => {
            this.allMyData.removeYourselfAsHostForBar(this.bar, this.http)
            .then((res) => {
                this.removeTheDeletedBarLocally();
                this.navCtrl.popTo(this.navCtrl.getByIndex(this.navCtrl.length()-3));
            })
            .catch((err) => {
                this.inputError = "An error occurred - please try removing yourself as a host again.";
                this.showEditBarErrorAlert();
                this.allMyData.logError(this.tabName, "server", "removeYourselfAsHostForBar query error: Err msg = " + err, this.http);
            });
        }
    });
    alert.present();
  }

  private removeTheDeletedBarLocally(){
    this.removeBarFromBarHostFor();
  }

  private removeBarFromBarHostFor(){
    let indexToRemove = this.allMyData.barHostFor.indexOf[this.bar.barID];
    let barHostFor = new Array<Bar>();
    for(let i = 0; i < barHostFor.length; i++){
        if(i != indexToRemove){
            barHostFor.push(this.allMyData.barHostFor[i]);
        }
    }
    this.allMyData.barHostFor = barHostFor;
  }
}
