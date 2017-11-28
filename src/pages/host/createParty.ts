import { Component, ViewChild, ElementRef } from '@angular/core';
import {Http, Headers, RequestOptions} from '@angular/http';
import { NavParams, NavController, AlertController} from 'ionic-angular';
import { Person } from '../../model/person';
import { AllMyData} from '../../model/allMyData';
import { Party, Invitee } from '../../model/party';
import { Bar } from '../../model/bar';
import { Geolocation, Geoposition, Geocoder} from 'ionic-native';
import { EditInviteeListPage } from './editInviteeList';
import { EditHostListPage } from './editHostList';
import { HostPage } from './host';
import { Utility } from "../../model/utility";

declare var google;

@Component({
  selector: 'page-createParty',
  templateUrl: 'createParty.html'
})
export class CreatePartyPage {

  @ViewChild('map') mapElement: ElementRef;
  public map: any;
  geocoder : any;
  private myLocationMarker : any;
  private party : Party;
  private partyMarker : any;
  private inputError : string;

  constructor(public allMyData : AllMyData, private http:Http, private navCtrl: NavController, params : NavParams, public alertCtrl: AlertController) {
    this.party = params.get("party");
  }

  ionViewWillLeave(){
    console.log(this.party);
  }

  private createDateTimeInISOFormat(dateOnly : string, timeOnly : string){
    let splitOfDateOnly = dateOnly.split("-");
    let splitOfTimeOnly = timeOnly.split(":");
    let localDateTime: Date = new Date();
    localDateTime.setFullYear(Number.parseInt(splitOfDateOnly[0]), Number.parseInt(splitOfDateOnly[1]) - 1, Number.parseInt(splitOfDateOnly[2]));
    localDateTime.setHours(Number.parseInt(splitOfTimeOnly[0]), Number.parseInt(splitOfTimeOnly[1]), 0);
    let utcDateTime = Utility.convertDateTimeToISOFormat(localDateTime);
    return utcDateTime;
  }

  ionViewDidLoad(){
    this.loadMap()
    .then((res) => {
      
    })
    .catch((err) => {
        console.log(err);
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

        this.partyMarker = new google.maps.Marker({ // just for initialization
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
        reject(err);
      });
    });
  }

  private updateMapMarker(){
    this.codeAddress(this.party.address);
  }

  private codeAddress(address : string) {
    let tempThis = this;
    this.geocoder.geocode( { 'address': address}, function(results, status) {
      if (status == 'OK') {
        tempThis.map.setCenter(results[0].geometry.location);
        var image = 'assets/darkgreen_MarkerP.png';
        tempThis.partyMarker.setMap(null);
        tempThis.partyMarker = new google.maps.Marker({
            map: tempThis.map,
            position: results[0].geometry.location,
            icon: image
        });
        tempThis.party.latitude = Number.parseFloat(results[0].geometry.location.lat());
        tempThis.party.longitude = Number.parseFloat(results[0].geometry.location.lng());
      } else {
        tempThis.partyMarker.setMap(null);
        tempThis.party.latitude = 1000; // represents the address being faulty
        tempThis.party.longitude = 1000; // represents the address being faulty
        console.log('Geocode was not successful for the following reason: ' + status);
      }
    });
  }

  private toggleDrinksProvided(){
    this.party.drinksProvided = !this.party.drinksProvided;
  }

  private toggleFeeForDrinks(){
    this.party.feeForDrinks = !this.party.feeForDrinks;
  }

  private editHostsButtonClicked(){
    this.navCtrl.push(EditHostListPage, {party:this.party}, {animate: false});
  }

  private editInviteesButtonClicked(){
    this.navCtrl.push(EditInviteeListPage, {party:this.party, initialInviteeList:this.party.invitees}, {animate: false});
  }

  private submitButtonClicked(){
    this.party.startTime = this.createDateTimeInISOFormat(this.party.startDateOnly, this.party.startTimeOnly);
    this.party.endTime = this.createDateTimeInISOFormat(this.party.endDateOnly, this.party.endTimeOnly);
    
    this.validateCreatePartyInput();
    if(this.inputError == ""){
      this.allMyData.createParty(this.party, this.http)
      .then((res) => {
        this.navCtrl.popTo(this.navCtrl.getByIndex(this.navCtrl.length()-3));
      })
      .catch((err) => {
        this.inputError = "Unknown error - please try creating the party again.";
        this.showCreatePartyErrorAlert();
        console.log(err);
      });
    }else{
      this.showCreatePartyErrorAlert();
    }
  }

  private validateCreatePartyInput(){
    this.inputError = "";
    if(this.party.title == ""){
      this.inputError = "Please give your party a title.";
    }
    if(this.party.details == ""){
      this.inputError = "Please enter some details about your party.";
    }
    if(this.party.address == ""){
      this.inputError = "Please give your party an address.";
    }
    if(this.party.latitude == 1000 || this.party.longitude == 1000){
      this.inputError = "Please give your party a legitimate address.";
    }
    if(this.party.startDateOnly == ""){
      this.inputError = "Please enter a start date.";
    }
    if(this.party.endDateOnly == ""){
      this.inputError = "Please enter an end date.";
    }
    if(this.party.startTimeOnly == ""){
      this.inputError = "Please enter a start time.";
    }
    if(this.party.endTimeOnly == ""){
      this.inputError = "Please enter an end time.";
    }

    if(this.party.startDateOnly != "" && this.party.endDateOnly != "" &&
       this.party.startTimeOnly != "" && this.party.endTimeOnly != ""){
      let startDate : Date = new Date(this.party.startTime);
      let endDate : Date = new Date(this.party.endTime);
      if(startDate > endDate){
        this.inputError = "Your party can't end before it starts.";
      }
    }
  }

  private showCreatePartyErrorAlert() {
    let alert = this.alertCtrl.create({
      title: 'Error!',
      subTitle: this.inputError,
      buttons: ['OK']
    });
    alert.present();
  }
}
