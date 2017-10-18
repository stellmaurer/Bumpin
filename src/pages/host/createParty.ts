import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Person } from '../../model/person';
import { AllMyData} from '../../model/allMyData';
import { Party } from '../../model/party';
import { Bar } from '../../model/bar';
import { Geolocation, Geoposition, Geocoder} from 'ionic-native';

declare var google;

@Component({
  selector: 'page-createParty',
  templateUrl: 'createParty.html'
})
export class CreatePartyPage {

  @ViewChild('mapForCreateParty') mapElement: ElementRef;
  public map: any;
  geocoder : any;
  private myLocationMarker : any;

  private title : string = "";
  private details : string = "";
  private address : string = "";
  private startDate : string;
  private endDate : string;
  private startTime : string;
  private endTime : string;
  private invitesForNewInvitees : number = 0;
  private drinksProvided : boolean = false;
  private feeForDrinks : boolean = true;

  private partyMarker : any;

  constructor(public allMyData : AllMyData, private navCtrl: NavController) {
    console.log("In createParty.ts");
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
          mapTypeId: google.maps.MapTypeId.ROADMAP
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
    this.codeAddress(this.address);
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
      } else {
        tempThis.partyMarker.setMap(null);
        console.log('Geocode was not successful for the following reason: ' + status);
      }
    });
  }

  private toggleDrinksProvided(){
    this.drinksProvided = !this.drinksProvided;
  }

  private toggleFeeForDrinks(){
    this.feeForDrinks = !this.feeForDrinks;
  }
}
