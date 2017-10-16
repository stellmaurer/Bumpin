import { Component } from '@angular/core';
import { FacebookAuth, User } from '@ionic/cloud-angular';
import { Facebook, FacebookLoginResponse } from '@ionic-native/facebook';
import { NavController, Events } from 'ionic-angular';
import { TabsPage } from '../tabs/tabs';
import { Person } from '../../model/person';
import {Http, Headers, RequestOptions} from '@angular/http';
import {deserialize} from "serializer.ts/Serializer";
import {AllMyData} from "../../model/allMyData"
import { NativeStorage } from 'ionic-native';

@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})
export class LoginPage {
  constructor(private allMyData : AllMyData, private http:Http, private events : Events, private fb : Facebook, public navCtrl: NavController, public facebookAuth: FacebookAuth, public user: User) {
    console.log("in LoginPage constructor");
    
    /*
    facebookAuth.login().then(function gotoNextPage() {
      console.log("in facebookAuth callback");

      this.createOrUpdatePerson();

      
      console.log(facebookAuth.getToken.toString());
      this.allMyData.me.setFacebookID(user.social.facebook.uid);
      this.allMyData.me.setName(user.social.facebook.data.full_name);
      console.log(this.allMyData.me.getFacebookID());
      console.log(this.allMyData.me.getName());
      console.log(user.social.facebook.data);
      //this.getFacebookInfo();
      navCtrl.push(TabsPage, {}, {animate: false});
    });*/
  }

  ionViewDidLoad(){
    this.login();
  }

  login(){
    this.fb.getLoginStatus()
    .then((response: FacebookLoginResponse) => {
      console.log('Checking status of login.', response);
      if (response.status === 'connected') {
        console.log("Login class: status is connected.")
        // the user is logged in and has authenticated your
        // app, and response.authResponse supplies
        // the user's ID, a valid access token, a signed
        // request, and the time the access token 
        // and signed request each expire
        let accessToken = response.authResponse.accessToken;
        this.createOrUpdatePersonWithFacebookInfo(accessToken);
      } else if (response.status === 'not_authorized') {
        // the user is logged in to Facebook, 
        // but has not authenticated your app
      } else {
        // the user isn't logged in to Facebook.
        this.fb.login(['public_profile', 'user_friends', 'email'])
        .then((response: FacebookLoginResponse) => {
          console.log('Logged into Facebook!', response);
          let accessToken = response.authResponse.accessToken;
          this.createOrUpdatePersonWithFacebookInfo(accessToken);
        })
        .catch(e => {
          console.log('Error logging into Facebook', e);
        });
      }
    })
    .catch(e => {
      console.log('Error checking status of login.', e);
    });
  }

  createOrUpdatePersonWithFacebookInfo(accessToken : string){
    console.log("Access Token = " + accessToken);
    this.allMyData.refreshMyDataFromFacebook(accessToken, this.http)
    .then((res) => {
      console.log("Facebook query finished");
      this.allMyData.createOrUpdatePerson(this.http)
      .then((res) => {
        this.events.publish("loginProcessComplete");
      })
      .catch((err) => {
        console.log(err);
      });
    })
    .catch((err) => {
      console.log("createOrUpdatePersonWithFacebookInfo query failed with error: " + err);
    });
  }
}