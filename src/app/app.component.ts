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
      this.rootPage = TabsPage;
      this.splashScreen.hide();
      this.statusBar.hide();
      /*this.statusBar.styleDefault();
      this.statusBar.overlaysWebView(false);
      this.statusBar.backgroundColorByHexString('#32db64');*/
      this.storePlatform();
      this.initPushNotification();
    });
  }

  private storePlatform(){
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
    if (!this.platform.is('cordova')) {
      console.warn('Push notifications not initialized. Cordova is not available - Run in physical device');
      return;
    }
    const options: PushOptions = {
      android: {
        senderID: '704208165367',
        iconColor: '#32db64',
        icon: 'push_notification_icon'
      },
      ios: {
        alert: 'true',
        badge: false,
        sound: 'true'
      },
      windows: {}
    };

    // Changing the default Android channel's importance level (need to do before push.init)
    this.push.createChannel({
      id: "PushPluginChannel",
      description: "Notification importance set to highest so that a banner shows up.",
      // The importance property goes from 1 = Lowest, 2 = Low, 3 = Normal, 4 = High and 5 = Highest.
      importance: 5
    }).then(() => console.log('Channel created'));

    const pushObject: PushObject = this.push.init(options);

    pushObject.on('registration').subscribe((data: any) => {
      console.log("deviceToken = " + data.registrationId);
      this.storage.set('deviceToken', data.registrationId);
    });

    pushObject.on('notification').subscribe((data: any) => {
      // On android push notifications, the library I'm using sets title to the app
      //  name if no title is given, but app name is already in the notification,
      //  so this is a work-around until the library fixes this.
      if(data.title !== undefined){
        data.message = data.title;
      }
      console.log("data.title = " + data.title);
      console.log("data.message = " + data.message);
      console.log('data.additionalData.partyOrBarID = ' + data.additionalData.partyOrBarID);
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
