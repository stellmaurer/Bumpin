import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { TabsPage } from '../pages/tabs/tabs';
import { ViewChild } from '@angular/core';
import { Events } from 'ionic-angular';
import { BackgroundGeolocation } from '@ionic-native/background-geolocation';

@Component({
  templateUrl: 'app.html',
  template: '<ion-nav #myNav [root]="rootPage"></ion-nav>'
})

export class MyApp {
  @ViewChild('myNav') nav
  private rootPage:any;

  constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen, private backgroundGeolocation: BackgroundGeolocation, private events : Events) {
    platform.ready().then(() => {
      this.rootPage = TabsPage;
      splashScreen.hide();
      statusBar.styleDefault();
    });
  }
}
