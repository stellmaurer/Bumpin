import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';
import { LoginPage } from '../pages/login/login';
import { MorePage } from '../pages/more/more';
import { RatePage } from '../pages/rate/rate';
import { HostPage } from '../pages/host/host';
import { FindPage } from '../pages/find/find';
import { PartyPopover } from '../pages/find/partyPopover'
import { BarPopover } from '../pages/find/barPopover'
import { TabsPage } from '../pages/tabs/tabs';
import { AllMyData } from '../model/allMyData';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { CloudSettings, CloudModule } from '@ionic/cloud-angular';
import { IonicStorageModule } from '@ionic/storage';

const cloudSettings: CloudSettings = {
  'core': {
    'app_id': '383d1262'
  },
  'auth': {
    'facebook': {
      // email and public_profile are included by default.
      'scope': ['user_friends']
    }
  }
};

@NgModule({
  declarations: [
    MyApp,
    LoginPage,
    MorePage,
    RatePage,
    HostPage,
    FindPage,
    PartyPopover,
    BarPopover,
    TabsPage
  ],
  imports: [
    IonicModule.forRoot(MyApp),
    CloudModule.forRoot(cloudSettings),
    IonicStorageModule.forRoot()
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    LoginPage,
    MorePage,
    RatePage,
    HostPage,
    FindPage,
    PartyPopover,
    BarPopover,
    TabsPage
  ],
  providers: [
    [AllMyData],
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
