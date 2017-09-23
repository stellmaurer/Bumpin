import { Injectable, NgZone } from '@angular/core';
import { BackgroundGeolocation } from '@ionic-native/background-geolocation';
import { Geolocation, Geoposition } from '@ionic-native/geolocation';
import 'rxjs/add/operator/filter';
 
@Injectable()
export class LocationTracker {
 
  public watch: any;    
  public lat: number = 0;
  public lng: number = 0;
  public foregroundOrBackground : string;
 
  constructor(public zone: NgZone, private backgroundGeolocation: BackgroundGeolocation, private geolocation: Geolocation) {
 
  }
 
  startTracking() {
    // ************* Foreground Tracking
    let options = {
      enableHighAccuracy: true
    };
  
    this.watch = this.geolocation.watchPosition(options).filter((p: any) => p.code === undefined);
    this.watch.subscribe((position: Geoposition) => {
      // Run update inside of Angular's zone
      this.zone.run(() => {
        this.lat = position.coords.latitude;
        this.lng = position.coords.longitude;
        this.foregroundOrBackground = "Foreground";
        console.log("Latitude: " + this.lat + "\n" + "Longitude: " + this.lng);
      });
    });
}
 
  stopTracking() {
    console.log('stopTracking');
    this.watch.unsubscribe();
  }
 
}

/*
import { Injectable, NgZone } from '@angular/core';
import { BackgroundGeolocation } from '@ionic-native/background-geolocation';
import { Geolocation, Geoposition } from '@ionic-native/geolocation';
import { Events } from 'ionic-angular';
import 'rxjs/add/operator/filter';
 
@Injectable()
export class LocationTracker {
 
  public watch: any;    
  public lat: number = 0;
  public lng: number = 0;
 
  constructor(private events : Events, public zone: NgZone, private backgroundGeolocation: BackgroundGeolocation, private geolocation: Geolocation) {
    var tempThis = this;
  }
 

startTracking() {
  // Background Tracking
 
  let config = {
    desiredAccuracy: 0,
    stationaryRadius: 5,
    distanceFilter: 5, 
    debug: true,
    interval: 2000 
  };
 
  this.backgroundGeolocation.configure(config).subscribe((location) => {
 
    // Run update inside of Angular's zone
    this.zone.run(() => {
      this.lat = location.latitude;
      this.lng = location.longitude;
      console.log('*************** BackgroundGeolocation:  ' + location.latitude + ',' + location.longitude);
    });
    this.backgroundGeolocation.finish();
  }, (err) => {
 
    console.log("THERE WAS AN ERROR!" + err);
 
  });

  // Turn ON the background-geolocation system.
  this.backgroundGeolocation.start();
}

  stopTracking() {
    this.backgroundGeolocation.stop();
    
  }
 
}*/