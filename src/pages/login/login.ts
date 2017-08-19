import { Component } from '@angular/core';
import { FacebookAuth, User } from '@ionic/cloud-angular';
import { NavController } from 'ionic-angular';
import { TabsPage } from '../tabs/tabs';
import { Person } from '../../model/person';
import {Http, Headers, RequestOptions} from '@angular/http';
import {deserialize} from "serializer.ts/Serializer";
import {AllMyData} from "../../model/allMyData"

@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})
export class LoginPage {
  constructor(private allMyData : AllMyData, private http:Http, public navCtrl: NavController, public facebookAuth: FacebookAuth, public user: User) {
    console.log("in LoginPage constructor");
    facebookAuth.login().then(function gotoNextPage() {
      console.log("in facebookAuth callback");

      this.createOrUpdatePerson();

      /*console.log(facebookAuth.getToken.toString());
      me.setFacebookID(user.social.facebook.uid);
      me.setName(user.social.facebook.data.full_name);
      console.log(me.getFacebookID());
      console.log(me.getName());
      console.log(user.social.facebook.data);*/
      //this.getFacebookInfo();
      navCtrl.push(TabsPage, {}, {animate: false});
    });
  }

  private createOrUpdatePerson(){
    var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/createOrUpdatePerson";
    let body = "facebookID=10155613117039816&isMale=true&name=Steve%20Ellmaurer";
    var headers = new Headers();
    headers.append('content-type', "application/x-www-form-urlencoded");
    let options= new RequestOptions({headers: headers});
    this.http.post(url, body, options).map(res => res.json()).subscribe(data => {
      console.log(data);
      this.getPerson();
    });
  }

  private getPerson(){
    var url = "http://bumpin-env.us-west-2.elasticbeanstalk.com:80/getPerson?facebookID=10155613117039816";
    this.http.get(url).map(res => res.json()).subscribe(data => {
      if(data.succeeded){
        this.allMyData.me = deserialize<Person>(Person, data.people[0]);
        console.log(this.allMyData.me);
      }else{
        console.log(data);
      }
    });
  }

/*
  private getFacebookInfo(){
    // curl "https://graph.facebook.com/me?fields=id,name,gender,friends&access_token=EAACEdEose0cBAB6rZA5M4FggQWjpvo7FUv0iRA4xpFZBZAdL5ElYrbNC92YAaaf1gy9zyVYfxyHWE51YcQ6Jh7hFhP9cgoJhQQapczYr1qZAs7ZCa4Re3ifb9q1zRBdVybE5KvydgUFo5Rs6DvEKZCWuFUdpMbjtkzQXMWh8dSGgvAWDah0rNTAZBIzo8JJxyAZD"
    //var url = "https://graph.facebook.com/me?fields=id,name,gender&access_token=" + this.facebookAuth.getToken();
    //console.log("This is the token: " + this.facebookAuth.getToken());
    /*
    this.http.get(url).map(res => res.json()).subscribe(data => {
      //var httpResult : JSON = JSON.parse(data)
      //console.log(data);
      //console.log(data);
      //console.log("query worked");
    });
}*/
}