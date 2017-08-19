import { Component } from '@angular/core';
import { App } from 'ionic-angular';
import { FacebookAuth } from '@ionic/cloud-angular';
import { FindPage } from '../find/find';
import { LoginPage } from '../login/login';
import { TabsPage } from '../tabs/tabs';

import { NavController } from 'ionic-angular';

@Component({
  selector: 'page-more',
  templateUrl: 'more.html'
})
export class MorePage {

  constructor(private app: App, public facebookAuth: FacebookAuth, public navCtrl: NavController) {

  }
  
  public logout(){
    this.facebookAuth.logout();
    const root = this.app.getRootNav();
    root.setRoot(LoginPage);
  }
}
