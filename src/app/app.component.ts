import { Component } from '@angular/core';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { AlertController, Nav, Platform, Events, Tabs, App } from 'ionic-angular';

import { TabsPage } from '../pages/tabs/tabs';
import { ViewChild } from '@angular/core';
import { BackgroundGeolocation, BackgroundGeolocationConfig, BackgroundGeolocationResponse } from '@ionic-native/background-geolocation';
import { Push, PushObject, PushOptions } from '@ionic-native/push';
import { Badge } from '@ionic-native/badge';
import { Storage } from '@ionic/storage';
import { HostPage } from '../pages/host/host';
import { FindPage } from '../pages/find/find';
import { NavController } from 'ionic-angular';
import { Http } from '@angular/http';
import { AllMyData } from '../model/allMyData';
import { Login } from '../pages/login/login';
import { Geolocation } from '@ionic-native/geolocation';
import { FriendsPage } from '../pages/more/friends';
import { LocationTracker } from '../providers/location-tracker';
import { LocalNotifications } from '@ionic-native/local-notifications';

@Component({
  templateUrl: 'app.html',
  template: '<ion-nav #myNav [root]="rootPage"></ion-nav>'
})

export class MyApp {
  @ViewChild('myNav') nav : NavController
  private rootPage:any;

  constructor(public app: App, private login : Login, private allMyData: AllMyData, private http: Http, public platform: Platform, private statusBar: StatusBar, private splashScreen: SplashScreen, private badge: Badge, public push: Push, private locationTracker: LocationTracker, public alertCtrl: AlertController, private backgroundGeolocation: BackgroundGeolocation, private events : Events, private storage: Storage) {
    this.platform.ready().then(() => {

      this.statusBar.overlaysWebView(false);
      this.statusBar.backgroundColorByHexString('#32db64');
      this.statusBar.styleDefault();

      this.locationTracker.startTracking();
      this.rootPage = TabsPage;

      this.badge.clear();
      this.platform.resume.subscribe((result)=>{//Foreground
        this.badge.clear();
      });

      this.storePlatform();
      this.initPushNotification();

      this.setUpLocalNotificationHandlers();

      this.loginToFacebook();
    });
  }

  private loginToFacebook(){
    // this is done to ensure quick app start-up times for the user - it takes the last known Facebook info
    //    the user had and uses that until Facebook login completes.
    this.login.populateFacebookInfoFromLocalStorage()
    .then((res) => {
      this.splashScreen.hide();
      this.actuallyLoginToFacebook();
    })
    .catch((err) => {
        console.log(err);
        this.actuallyLoginToFacebook();
    });
  }

  private actuallyLoginToFacebook(){
    this.login.login()
    .then((res) => {
      this.splashScreen.hide();
    })
    .catch((err) => {
        // error logging is already done in the Login file
        this.loginToFacebook(); // try again until logging in works
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

  private setUpLocalNotificationHandlers(){
    let tempThis = this;
    LocalNotifications.getPlugin().on('click', function (notification, eopts) {
      tempThis.app.getRootNav().getActiveChildNav().select(1);
    });
    LocalNotifications.getPlugin().on('yes', function (notification, eopts) {
      tempThis.app.getRootNav().getActiveChildNav().select(1);
    });
    LocalNotifications.getPlugin().on('no', function (notification, eopts) {
      tempThis.locationTracker.clearNotifications();
      tempThis.locationTracker.updateWhereIAmAt(null);
      tempThis.locationTracker.userSaidTheyAreNotAtAPartyOrBar = true;
      tempThis.storage.set("userSaidTheyAreNotAtAPartyOrBar", true);
      tempThis.locationTracker.createTimerForClearingUserSaidTheyAreNotAtAPartyOrBar();
    });
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
        badge: true,
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
              }else if(message.includes("go out")){
                this.storage.set('goingOutStatusNotification', data.message);
                this.app.getRootNav().getActiveChildNav().select(3);
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
            this.app.getRootNav().getActiveChildNav().select(0);
          }
        }else if(message.includes("bar")){
          this.app.getRootNav().getActiveChildNav().select(2);
        }else if(message.includes("go out")){
          this.storage.set('goingOutStatusNotification', data.message);
          this.app.getRootNav().getActiveChildNav().select(3);
        }
      }
    });

    pushObject.on('error').subscribe(error => console.error('Error with Push plugin' + error));
  }
}
