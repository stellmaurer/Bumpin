import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavParams, NavController} from 'ionic-angular';
import { Person } from '../../model/person';
import { AllMyData} from '../../model/allMyData';
import { Party, Invitee } from '../../model/party';
import { Bar } from '../../model/bar';
import { Geolocation, Geoposition, Geocoder} from 'ionic-native';
import { EditInviteeListPage } from './editInviteeList';
import { EditHostListPage } from './editHostList';
import { Utility } from "../../model/utility";

declare var google;

@Component({
  selector: 'page-editParty',
  templateUrl: 'editParty.html'
})
export class EditPartyPage {

  @ViewChild('map') mapElement: ElementRef;
  public map: any;
  geocoder : any;
  private myLocationMarker : any;

  private party : Party;

  private partyMarker : any;

  constructor(public allMyData : AllMyData, private navCtrl: NavController, params : NavParams) {
    this.party = params.get("party");
  }

  ionViewWillLeave(){
    this.party.startTime = this.createDateTimeInISOFormat(this.party.startDateOnly, this.party.startTimeOnly);
    this.party.endTime = this.createDateTimeInISOFormat(this.party.endDateOnly, this.party.endTimeOnly);

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
}
