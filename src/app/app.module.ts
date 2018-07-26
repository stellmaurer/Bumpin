import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';
import { MorePage } from '../pages/more/more';
import { NotificationsPage } from '../pages/more/notifications';
import { FriendsPage } from '../pages/more/friends';
import { MyStatusPage } from '../pages/more/myStatus';
import { CheckIntoPartyPopoverPage } from '../pages/rate/checkIntoPartyPopover';
import { CheckIntoBarPopoverPage } from '../pages/rate/checkIntoBarPopover';
import { CheckInPage } from '../pages/rate/check-in';
import { HostPage } from '../pages/host/host';
import { FindPage } from '../pages/find/find';
import { InviteFriendsPage } from '../pages/find/inviteFriends';
import { InvitedFriendsPage } from '../pages/find/invitedFriends';
import { PartyPopover } from '../pages/find/partyPopover'
import { BarPopover } from '../pages/find/barPopover'
import { TabsPage } from '../pages/tabs/tabs';
import { CreatePartyPage } from '../pages/host/createParty';
import { EditPartyPage } from '../pages/host/editParty';
import { EditBarPage } from '../pages/host/editBar';
import { CreateBarPage } from '../pages/host/createBar';
import { EditHostListPage } from '../pages/host/editHostList';
import { EditInviteeListPage } from '../pages/host/editInviteeList';
import { AllMyData } from '../model/allMyData';
import { LocationTracker } from '../providers/location-tracker';
import { BackgroundGeolocation } from '@ionic-native/background-geolocation';
import { Geolocation } from '@ionic-native/geolocation';
import { Push } from '@ionic-native/push';
import { Badge } from '@ionic-native/badge';
import { Facebook } from '@ionic-native/facebook';
import { Login } from '../pages/login/login';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { CloudSettings, CloudModule } from '@ionic/cloud-angular';
import { IonicStorageModule } from '@ionic/storage';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { Diagnostic } from '@ionic-native/diagnostic';
import { LocalNotifications } from '@ionic-native/local-notifications';
import { ClaimBarPage } from '../pages/find/claimBar';
import { AppVersion } from '@ionic-native/app-version';


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
    MorePage,
    NotificationsPage,
    FriendsPage,
    MyStatusPage,
    CheckIntoPartyPopoverPage,
    CheckIntoBarPopoverPage,
    CheckInPage,
    HostPage,
    ClaimBarPage,
    FindPage,
    InviteFriendsPage,
    InvitedFriendsPage,
    CreatePartyPage,
    EditPartyPage,
    EditBarPage,
    CreateBarPage,
    EditHostListPage,
    EditInviteeListPage,
    PartyPopover,
    BarPopover,
    TabsPage
  ],
  imports: [
    BrowserModule,
    HttpModule,
    IonicModule.forRoot(MyApp,{statusbarPadding: false}),
    CloudModule.forRoot(cloudSettings),
    IonicStorageModule.forRoot()
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    MorePage,
    NotificationsPage,
    FriendsPage,
    MyStatusPage,
    CheckIntoPartyPopoverPage,
    CheckIntoBarPopoverPage,
    CheckInPage,
    HostPage,
    ClaimBarPage,
    FindPage,
    InviteFriendsPage,
    InvitedFriendsPage,
    CreatePartyPage,
    EditPartyPage,
    EditBarPage,
    CreateBarPage,
    EditHostListPage,
    EditInviteeListPage,
    PartyPopover,
    BarPopover,
    TabsPage
  ],
  providers: [
    LocationTracker,
    BackgroundGeolocation,
    Push,
    LocalNotifications,
    Badge,
    Facebook,
    Diagnostic,
    Geolocation,
    AppVersion,
    [AllMyData],
    [Login],
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
