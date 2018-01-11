import { Component, ViewChild, ElementRef } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { NavParams, NavController, AlertController} from 'ionic-angular';
import { Person } from '../../model/person';
import { AllMyData} from '../../model/allMyData';
import { Bar, Attendee, Host } from '../../model/bar';
import { Geolocation, Geoposition, Geocoder} from 'ionic-native';
import { EditAttendeeListPage } from './editAttendeeList';
import { EditHostListPage } from './editHostList';
import { HostPage } from './host';
import { Utility } from "../../model/utility";

declare var google;

@Component({
  selector: 'page-editBar',
  templateUrl: 'editBar.html'
})
export class EditBarPage {

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
        reject(err);
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
        console.log('Geocode was not successful for the following reason: ' + status);
      }
    });
  }

  private editHostsButtonClicked(){
    this.navCtrl.push(EditHostListPage, {bar:this.bar}, {animate: false});
  }

  private deleteButtonClicked(){
      this.allMyData.deleteBar(this.bar, this.http)
      .then((res) => {
        this.navCtrl.popTo(this.navCtrl.getByIndex(this.navCtrl.length()-3));
      })
      .catch((err) => {
        this.inputError = "Unknown error - please try deleting the bar again.";
        this.showEditBarErrorAlert();
        console.log(err);
      });
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
            this.inputError = "Unknown error - please try editing the bar again.";
            this.showEditBarErrorAlert();
            console.log(err);
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

  private showDeleteBarErrorAlert() {
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
            })
            .catch((err) => {
                console.log(err);
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
