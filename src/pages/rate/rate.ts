import { Component, ViewChild, ElementRef } from '@angular/core';
import {Http} from '@angular/http';

import { NavController } from 'ionic-angular';

@Component({
  selector: 'page-rate',
  templateUrl: 'rate.html',
})
export class RatePage {
  //@ViewChild('parties') parties;
  parties;

  constructor(private http:Http, public navCtrl: NavController) {
    this.parties = "it worked";
    this.getParties();
  }

  public getParties(){
    var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/myParties?partyIDs=1,2";
    this.http.get(url).map(res => res.json()).subscribe(data => {
      //var httpResult : JSON = JSON.parse(data)
      //console.log(data);
      this.parties = JSON.stringify(data);
    });
  }
}
