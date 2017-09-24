import { Injectable, NgZone } from '@angular/core';
import { BackgroundGeolocation } from '@ionic-native/background-geolocation';
import { Geolocation, Geoposition } from '@ionic-native/geolocation';
import 'rxjs/add/operator/filter';
 
@Injectable()
export class LocationTracker {
 
  public watch: any;    
  public lat: number = 0;
  public lng: number = 0;
 
  constructor(public zone: NgZone, private backgroundGeolocation: BackgroundGeolocation, private geolocation: Geolocation) {
 
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
      // Run update inside of Angular's zone
      this.zone.run(() => {
        this.lat = position.coords.latitude;
        this.lng = position.coords.longitude;
        console.log("Latitude: " + this.lat + ", " + "Longitude: " + this.lng);
      });
    });
    // Turn ON the background-geolocation system.
    this.backgroundGeolocation.start();
}
 
  stopTracking() {
    console.log('stopTracking');
    this.watch.unsubscribe();
    this.backgroundGeolocation.stop();
  }
 
}