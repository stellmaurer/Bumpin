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
import {Http} from '@angular/http';
import { NavParams, NavController, AlertController, Events} from 'ionic-angular';
import { AllMyData} from '../../model/allMyData';
import { Bar } from '../../model/bar';
import { Geolocation} from 'ionic-native';
import { EditHostListPage } from './editHostList';

declare var google;

@Component({
  selector: 'page-createBar',
  templateUrl: 'createBar.html'
})
export class CreateBarPage {

  private tabName: string = "Host Tab";
  @ViewChild('map') mapElement: ElementRef;
  public map: any;
  geocoder : any;
  private myLocationMarker : any;
  private bar: Bar;
  private barMarker : any;
  private inputError : string;
  
  private datePickerMinYear : number;

  private daysOfTheWeek : string[] = [ "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday" ];

  constructor(public allMyData : AllMyData, private events:Events, private http:Http, private navCtrl: NavController, params : NavParams, public alertCtrl: AlertController) {
    this.bar = params.get("bar");
    this.datePickerMinYear = (new Date()).getFullYear();
  }

  ionViewDidLoad(){
    this.loadMap()
    .then((res) => {
      
    })
    .catch((err) => {
      this.allMyData.logError(this.tabName, "google maps", "getCurrentPosition error: Err msg = " + err, this.http);
    });
  }

  private getBarKeyButtonClicked(){
    let alert = this.alertCtrl.create();
    alert.setTitle("Email us to get a bar key");
    alert.setSubTitle("Include a picture which shows that you work at or own the bar at that address - a picture of you working at the bar, or a picture the utility bill or lease agreement with the address showing will do.");

    alert.addButton({
      text: 'Not now',
      handler: data => {
        
      }
    });
    alert.addButton({
      text: 'Email us',
      handler: data => {
        window.open("mailto:bumpin.inc@gmail.com?Subject=Bar%20Key%20-%20Proof%20of%20Address");
      }
    });
    alert.present();
  }

  private getAddressForBarKey(){
    this.allMyData.getAddressForBarKey(this.bar, this.http)
    .then((res) => {
      this.updateMapMarker();
    })
    .catch((err) => {
      this.updateMapMarker();
      this.allMyData.logError(this.tabName, "server", "getAddressForBarKey query error: Err msg = " + err, this.http);
    });
  }

  private keyUpInBarKeyInput(event : any){
    if(event.keyCode == 13){
      this.getAddressForBarKey();
    }
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
        var image = 'assets/blue_MarkerB.png';
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

  private editHostsButtonClicked(){
    this.navCtrl.push(EditHostListPage, {bar:this.bar}, {animate: false});
  }

  private submitButtonClicked(){
    this.validateCreateBarInput();
    if(this.inputError == ""){
      this.allMyData.createBar(this.bar, this.http)
      .then((res) => {
        this.events.publish("userHasJustCreatedABar");
        this.navCtrl.popTo(this.navCtrl.getByIndex(this.navCtrl.length()-3));
      })
      .catch((err) => {
        this.inputError = "An error occurred - please try creating the bar again.";
        this.showCreateBarErrorAlert();
        this.allMyData.logError(this.tabName, "server", "createBar query error: Err msg = " + err, this.http);
      });
    }else{
      this.showCreateBarErrorAlert();
    }
  }

  private validateCreateBarInput(){
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
    if(this.bar.key == ""){
      this.inputError = "Please enter a bar key to get an address.";
    }
    if(this.bar.key != "" && this.bar.address == ""){
      this.inputError = "It looks like you entered a bar key that doesn't exist.";
    }
    if(this.bar.latitude == 1000 || this.bar.longitude == 1000){
      this.inputError = "The address for this bar key is illegitimate - we should've caught this, sorry! Please reply to the email we sent with your bar key so that we can fix this.";
    }
  }

  private showCreateBarErrorAlert() {
    let alert = this.alertCtrl.create({
      title: 'Error!',
      subTitle: this.inputError,
      buttons: ['OK']
    });
    alert.present();
  }
}
