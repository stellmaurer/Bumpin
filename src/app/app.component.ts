import { Component } from '@angular/core';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { AlertController, Nav, Platform } from 'ionic-angular';

import { TabsPage } from '../pages/tabs/tabs';
import { ViewChild } from '@angular/core';
import { Events } from 'ionic-angular';
import { BackgroundGeolocation } from '@ionic-native/background-geolocation';
import { Push, PushObject, PushOptions } from '@ionic-native/push';
import { Storage } from '@ionic/storage';

@Component({
  templateUrl: 'app.html',
  template: '<ion-nav #myNav [root]="rootPage"></ion-nav>'
})

export class MyApp {
  @ViewChild('myNav') nav
  private rootPage:any;

  constructor(public platform: Platform, private statusBar: StatusBar, private splashScreen: SplashScreen, public push: Push, public alertCtrl: AlertController, private backgroundGeolocation: BackgroundGeolocation, private events : Events, private storage: Storage) {
    console.log("app.component.ts: in constructor");
    this.platform.ready().then(() => {
      console.log("app.component.ts: in platform.ready function");
      this.rootPage = TabsPage;
      this.splashScreen.hide();
      //this.statusBar.hide();
      this.statusBar.styleDefault();
      this.statusBar.overlaysWebView(false);
      this.statusBar.backgroundColorByHexString('#32db64');
      this.storePlatform();
      this.initPushNotification();
    });
  }

  ngOnInit(){
    console.log("app.component.ts: in ngOnInit");
  }

  private storePlatform(){
    console.log("in storePlatform");
    this.storage.set('platform', 'unknown');
    let isIOS = this.platform.is('ios');
    let isAndroid = this.platform.is('android');
    if(isIOS == true){
      this.storage.set('platform', 'iOS');
    }
    if(isAndroid == true){
      this.storage.set('platform', 'Android');
    }
  }

  initPushNotification() {
    console.log("in initPushNotification");
    if (!this.platform.is('cordova')) {
      console.warn('Push notifications not initialized. Cordova is not available - Run in physical device');
      return;
    }
    const options: PushOptions = {
      android: {
        senderID: 'YOUR_SENDER_ID'
      },
      ios: {
        alert: 'true',
        badge: false,
        sound: 'true'
      },
      windows: {}
    };
    const pushObject: PushObject = this.push.init(options);

    pushObject.on('registration').subscribe((data: any) => {
      this.storage.set('deviceToken', data.registrationId);
    });

    pushObject.on('notification').subscribe((data: any) => {
      console.log('message -> ' + data.message);
      //if user using app and push notification comes
      if (data.additionalData.foreground) {
        // if application open, show popup
        let confirmAlert = this.alertCtrl.create({
          title: 'New Notification',
          message: data.message,
          buttons: [{
            text: 'Ignore',
            role: 'cancel'
          }, {
            text: 'View',
            handler: () => {
              //TODO: Your logic here
              //this.nav.push(DetailsPage, { message: data.message });
            }
          }]
        });
        confirmAlert.present();
      } else {
        //if user NOT using app and push notification comes
        //TODO: Your logic on click of push notification directly
        //this.nav.push(DetailsPage, { message: data.message });
        console.log('Push notification clicked');
      }
    });

    pushObject.on('error').subscribe(error => console.error('Error with Push plugin' + error));
  }
}
