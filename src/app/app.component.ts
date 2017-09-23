import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { TabsPage } from '../pages/tabs/tabs';
import { LoginPage } from '../pages/login/login';
import { NativeStorage } from 'ionic-native';
import { ViewChild } from '@angular/core';
import { Events } from 'ionic-angular';
import { BackgroundGeolocation, BackgroundGeolocationConfig, BackgroundGeolocationResponse } from '@ionic-native/background-geolocation';

@Component({
  templateUrl: 'app.html',
  template: '<ion-nav #myNav [root]="rootPage"></ion-nav>'
})

export class MyApp {
  @ViewChild('myNav') nav
  private rootPage:any;

  constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen, private backgroundGeolocation: BackgroundGeolocation, private events : Events) {
    platform.ready().then(() => {
      /*
      // Here we will check if the user is already logged in
      // because we don't want to ask users to log in each time they open the app
      let env = this;
      NativeStorage.getItem('user')
      .then( function (data) {
        // user is previously logged and we have his data
        // we will let him access the app
        env.nav.push(TabsPage);
        splashScreen.hide();
      }, function (error) {
        //we don't have the user data so we will ask him to log in
        env.nav.push(LoginPage);
        splashScreen.hide();
      });
      */
      
      let env = this;
      //env.nav.push(LoginPage);
      env.nav.push(TabsPage);
      //this.rootPage = TabsPage;
      splashScreen.hide();
      statusBar.styleDefault();
    });
  }
}
