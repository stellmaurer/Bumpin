import { Component } from '@angular/core';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { AlertController, Nav, Platform, Events, Tabs, App } from 'ionic-angular';

import { TabsPage } from '../pages/tabs/tabs';
import { ViewChild } from '@angular/core';
import { BackgroundGeolocation } from '@ionic-native/background-geolocation';
import { Push, PushObject, PushOptions } from '@ionic-native/push';
import { Badge } from '@ionic-native/badge';
import { Storage } from '@ionic/storage';
import { HostPage } from '../pages/host/host';
import { FindPage } from '../pages/find/find';
import { NavController } from 'ionic-angular';
import { Http } from '@angular/http';
import { AllMyData } from '../model/allMyData';

@Component({
  templateUrl: 'app.html',
  template: '<ion-nav #myNav [root]="rootPage"></ion-nav>'
})

export class MyApp {
  @ViewChild('myNav') nav : NavController
  private rootPage:any;

  constructor(public app: App, private allMyData: AllMyData, private http: Http, public platform: Platform, private statusBar: StatusBar, private splashScreen: SplashScreen, private badge: Badge, public push: Push, public alertCtrl: AlertController, private backgroundGeolocation: BackgroundGeolocation, private events : Events, private storage: Storage) {
    this.platform.ready().then(() => {
      this.storePlatform();
      this.initPushNotification();
      this.rootPage = TabsPage;
      this.splashScreen.hide();
      this.statusBar.hide();

      //this.badge.set(10);
      //this.badge.increase(1);
      //this.badge.clear();

      this.badge.requestPermission();

      this.platform.resume.subscribe((result)=>{//Foreground
        console.log("App in foreground.");
        this.allMyData.logError("Find Tab", "client", "App in foreground", this.http);
        this.badge.clear();
      });

      /*this.statusBar.styleDefault();
      this.statusBar.overlaysWebView(false);
      this.statusBar.backgroundColorByHexString('#32db64');*/
    });
  }

  private storePlatform(){
    this.storage.set('platform', 'Unknown');
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
      this.storage.set('deviceToken', data.registrationId);
    });

    pushObject.on('notification').subscribe((data: any) => {
      // On android push notifications, the library I'm using sets title to the app
      //  name if no title is given, but app name is already in the notification,
      //  so this is a work-around until the library fixes this.
      if(data.title !== undefined){
        data.message = data.title;
      }
      //if user using app and push notification comes
      if (data.additionalData.foreground) {
        // if application open, show popup
        let confirmAlert = this.alertCtrl.create({
          message: data.message,
          buttons: [{
            text: 'Ignore',
            role: 'cancel'
          }, {
            text: 'View',
            handler: () => {
              let message = <string>data.message;
              if(message.includes("party")){
                if(message.includes("host")){
                  this.app.getRootNav().getActiveChildNav().select(2);
                }
                if(message.includes("invited")){
                  this.storage.set('partyIDForPushNotification', data.additionalData.partyOrBarID);
                  this.app.getRootNav().getActiveChildNav().select(0);
                }
              }else if(message.includes("bar")){
                if(message.includes("host")){
                  this.app.getRootNav().getActiveChildNav().select(2);
                }
              }
            }
          }]
        });
        confirmAlert.present();
      } else {
        //if user NOT using app and push notification comes
        let message = <string>data.message;
        if(message.includes("party")){
          if(message.includes("host")){
            this.app.getRootNav().getActiveChildNav().select(2);
          }
          if(message.includes("invited")){
            this.storage.set('partyIDForPushNotification', data.additionalData.partyOrBarID);
          }
        }else if(message.includes("bar")){
          this.app.getRootNav().getActiveChildNav().select(2);
        }
      }
    });

    pushObject.on('error').subscribe(error => console.error('Error with Push plugin' + error));
  }
}
