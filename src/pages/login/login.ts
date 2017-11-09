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
import { Injectable } from '@angular/core';
import { LocationTracker } from '../../providers/location-tracker';

@Injectable()
export class Login {
  constructor(private allMyData : AllMyData, private http:Http, private events : Events, private fb : Facebook, private locationTracker: LocationTracker) {}

  public login(){
    return new Promise((resolve, reject) => {
      this.fb.getLoginStatus()
      .then((response: FacebookLoginResponse) => {
        if (response.status === 'connected') {
          console.log("You are logged into Facebook already.");
          // the user is logged in and has authenticated your
          // app, and response.authResponse supplies
          // the user's ID, a valid access token, a signed
          // request, and the time the access token 
          // and signed request each expire
          let accessToken = response.authResponse.accessToken;
          this.createOrUpdatePersonWithFacebookInfo(accessToken)
          .then((res) => {
            console.log("createOrUpdatePersonWithFacebookInfo function successfully completed.");
            resolve("Login process completed.");
          })
          .catch(err => {
            console.log("Error in createOrUpdatePersonWithFacebookInfo function.");
            reject(err);
          });
        } else if (response.status === 'not_authorized') {
          // the user is logged in to Facebook, 
          // but has not authenticated your app
          console.log("User hasn't authenticated app - whatever that means...");
          reject("User hasn't authenticated app - whatever that means...");
        } else {
          // the user isn't logged in to Facebook.
          this.fb.login(['public_profile', 'user_friends'])
          .then((response: FacebookLoginResponse) => {
            console.log('Logged into Facebook!', response);
            let accessToken = response.authResponse.accessToken;
            this.createOrUpdatePersonWithFacebookInfo(accessToken)
            .then((res) => {
              resolve("Login process completed.");
            })
            .catch(err => {
              reject(err);
            });
          })
          .catch(e => {
            console.log('Error logging into Facebook', e);
            console.log("Trying to log you out and retry.");
            this.logout()
            .then((response: FacebookLoginResponse) => {
              this.fb.login(['public_profile', 'user_friends'])
              .then((response: FacebookLoginResponse) => {
                console.log('Logged into Facebook!', response);
                let accessToken = response.authResponse.accessToken;
                this.createOrUpdatePersonWithFacebookInfo(accessToken)
                .then((res) => {
                  resolve("Login process completed.");
                })
                .catch(err => {
                  console.log("Error in createOrUpdatePersonWithFacebookInfo function.");
                  reject(err);
                });
              })
              .catch(e => {
                console.log("We tried logging you out of Facebook and trying to log in again, but it didn't work. Here's the error: " + e);
                reject(e);
              });
            })
            .catch(e => {
              console.log('Error logging out of Facebook', e);
              reject(e);
            });
          });
        }
      })
      .catch(e => {
        console.log('Error checking status of login.', e);
        reject(e);
      });
    });
  }

  public logout(){
    return new Promise((resolve, reject) => {
      this.fb.logout()
      .then((response: FacebookLoginResponse) => {
        console.log("Logged out successfully.");
        this.login()
        .then((res) => {
          this.events.publish("aDifferentUserJustLoggedIn");
          resolve("Logged out and back in successfully.");
        })
        .catch((err) => {
          reject(err);
        });
      })
      .catch(e => {
        console.log('Error logging out.', e);
        reject(e);
      });
    });
  }

  createOrUpdatePersonWithFacebookInfo(accessToken : string){
    return new Promise((resolve, reject) => {
      console.log("Access Token = " + accessToken);
      this.allMyData.refreshMyDataFromFacebook(accessToken, this.http)
      .then((res) => {
        this.allMyData.createOrUpdatePerson(this.http)
        .then((res) => {
          resolve("Just created or updated Person in DynamoDB with new Facebook info.");
        })
        .catch((err) => {
          reject(err);
        });
      })
      .catch((err) => {
        reject(err);
      });
    });
  }
}