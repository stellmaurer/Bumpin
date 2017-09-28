import { Injectable, NgZone } from '@angular/core';
import { BackgroundGeolocation } from '@ionic-native/background-geolocation';
import { Geolocation, Geoposition } from '@ionic-native/geolocation';
import 'rxjs/add/operator/filter';
import { AllMyData } from '../model/allMyData';
import { Party } from '../model/party';
import { Bar, Attendee } from '../model/bar';
import { Utility } from '../model/utility';
import { Http } from '@angular/http';
 
@Injectable()
export class LocationTracker {
 
  public watch: any;    
  public lat: number = 0;
  public lng: number = 0;
 
  constructor(private allMyData : AllMyData, public zone: NgZone, private backgroundGeolocation: BackgroundGeolocation, private geolocation: Geolocation, private http : Http) {
 
  }


 
  startTracking() {
    let foregroundConfig = {
      enableHighAccuracy: true
    };
    let backgroundConfig = {
      desiredAccuracy: 0,
      stationaryRadius: 5,
      distanceFilter: 5, 
      debug: false,
      interval: 2000 
    };
    this.backgroundGeolocation.configure(backgroundConfig);
  
    this.watch = this.geolocation.watchPosition(foregroundConfig).filter((p: any) => p.code === undefined);
    this.watch.subscribe((position: Geoposition) => {
      //this.findClosestPartyOrBar(position.coords.latitude, position.coords.longitude);
      var thePartyOrBarIAmCurrentlyAt = this.findThePartyOrBarIAmAt(position.coords.latitude, position.coords.longitude);
      this.updateMyAtPartyOrAtBarStatuses(this.allMyData.thePartyOrBarIAmAt, thePartyOrBarIAmCurrentlyAt);
      this.allMyData.thePartyOrBarIAmAt = thePartyOrBarIAmCurrentlyAt;

      // Run update inside of Angular's zone
      this.zone.run(() => {
        this.lat = position.coords.latitude;
        this.lng = position.coords.longitude;
        console.log("Latitude: " + this.lat + ", " + "Longitude: " + this.lng);
      });
    });
    // Turn ON the background-geolocation system.
    //this.backgroundGeolocation.start();
  }
 
  stopTracking() {
    console.log('stopTracking');
    this.watch.unsubscribe();
    this.backgroundGeolocation.stop();
  }

  updateMyAtPartyOrAtBarStatuses(partyOrBarIWasAt : any, partyOrBarIAmAt : any){
    let party : Party = null;
    let bar : Bar = null;

    if((partyOrBarIWasAt == null) && (partyOrBarIAmAt == null)){
      // no need to update anything because we weren't at a party/bar and we still aren't at
      //    a party/bar
      return false;
    }
    if((partyOrBarIWasAt == null) && (partyOrBarIAmAt != null)){
      // I wasn't previously at a bar/party, but now am, so I just need to communicate that I'm at
      //    this new party/bar.
      console.log("I wasn't previously at a bar/party, but now am, so I just need to communicate that I'm at this new party/bar.");
      if(partyOrBarIAmAt instanceof Party){
        party = partyOrBarIAmAt;
        this.allMyData.changeAtPartyStatus(party, true, this.http);
      }else{
        bar = partyOrBarIAmAt;
        this.allMyData.changeAtBarStatus(bar, true, this.http);
      }
    }else if((partyOrBarIWasAt != null) && (partyOrBarIAmAt == null)){
      // I was at a bar/party, but now I am not, so I just need to communicate that I'm not at that
      //    bar/party anymore.
      console.log("I was at a bar/party, but now I am not, so I just need to communicate that I'm not at that bar/party anymore.");
      if(partyOrBarIWasAt instanceof Party){
        party = partyOrBarIWasAt;
        this.allMyData.changeAtPartyStatus(party, false, this.http);
      }else{
        bar = partyOrBarIWasAt;
        this.allMyData.changeAtBarStatus(bar, false, this.http);
      }
    }else if((partyOrBarIWasAt != null) && (partyOrBarIAmAt != null)){
      // I was at a bar/party, and now I am at another bar/party, so I need to communicate that
      //    I'm not at the bar/party I was at, and that I'm at this new bar/party.
      console.log("I was at a bar/party, and now I am at another bar/party, so I need to communicate that I'm not at the bar/party I was at, and that I'm at this new bar/party.");
      if(partyOrBarIWasAt instanceof Party){
        party = partyOrBarIWasAt;
        this.allMyData.changeAtPartyStatus(party, false, this.http);
      }else{
        bar = partyOrBarIWasAt;
        this.allMyData.changeAtBarStatus(bar, false, this.http);
      }
      if(partyOrBarIAmAt instanceof Party){
        party = partyOrBarIAmAt;
        this.allMyData.changeAtPartyStatus(party, true, this.http);
      }else{
        bar = partyOrBarIAmAt;
        this.allMyData.changeAtBarStatus(bar, true, this.http);
      }
    }
    return true;
  }

  // returns null if I am not within 20 meters of a party or bar
  findThePartyOrBarIAmAt(myLatitude : number, myLongitude : number){
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
    if((closestPartyOrBar == null) || (max > 20)){
      return null;
    }
    
    if(closestPartyOrBar instanceof Party){
      var closestParty : Party = closestPartyOrBar;
      console.log("You are currently at the party, " + closestParty.title + ".");
    }else if (closestPartyOrBar instanceof Bar){
      var closestBar : Bar = closestPartyOrBar;
      console.log("You are currently at the bar, " + closestBar.name + ".");
    }else{
      console.log("You are not currently at a party or bar.");
    }
    return closestPartyOrBar;
  }
 
  findClosestPartyOrBar(myLatitude : number, myLongitude : number){
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
    console.log("Distance to closest party or bar is " + max + " meters away.");
    if(closestPartyOrBar instanceof Party){
      var closestParty : Party = closestPartyOrBar;
      console.log(closestParty.title + " is the closest to you.");
    }else if (closestPartyOrBar instanceof Bar){
      var closestBar : Bar = closestPartyOrBar;
      console.log(closestBar.name + " is the closest to you.");
    }else{
      console.log("There's an error in the findClosestPartyOrBar function.");
    }
    return closestPartyOrBar;
  }
}