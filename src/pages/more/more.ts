import { Component } from '@angular/core';
import { App } from 'ionic-angular';
import { FacebookAuth } from '@ionic/cloud-angular';
import { Facebook, FacebookLoginResponse } from '@ionic-native/facebook';
import { FindPage } from '../find/find';
import { AllMyData } from '../../model/allMyData';
import { Login } from '../login/login';
import { TabsPage } from '../tabs/tabs';

import { NavController } from 'ionic-angular';

@Component({
  selector: 'page-more',
  templateUrl: 'more.html'
})
export class MorePage {

  constructor(private app: App, private fb : Facebook, private login : Login, public facebookAuth: FacebookAuth, public allMyData : AllMyData) {

  }
}
