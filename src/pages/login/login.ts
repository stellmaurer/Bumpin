/*******************************************************
 * Copyright (C) 2018 Stephen Ellmaurer <stellmaurer@gmail.com>
 * 
 * This file is part of the Bumpin mobile app project.
 * 
 * The Bumpin project and any of the files within the Bumpin
 * project can not be copied and/or distributed without
 * the express permission of Stephen Ellmaurer.
 *******************************************************/

import { Facebook, FacebookLoginResponse } from '@ionic-native/facebook';
import { Events } from 'ionic-angular';
import {Http} from '@angular/http';
import {AllMyData} from "../../model/allMyData"
import { Injectable } from '@angular/core';

@Injectable()
export class Login {

  private tabName : string = "More Tab";

  constructor(private allMyData : AllMyData, private http:Http, private events : Events, private fb : Facebook) {}

  public login(){
    return new Promise((resolve, reject) => {
      this.fb.getLoginStatus()
      .then((response: FacebookLoginResponse) => {
        if (response.status === 'connected') {
          // the user is logged in and has authenticated your
          // app, and response.authResponse supplies
          // the user's ID, a valid access token, a signed
          // request, and the time the access token 
          // and signed request each expire
          let accessToken = response.authResponse.accessToken;
          this.createOrUpdatePersonWithFacebookInfo(accessToken)
          .then((res) => {
            resolve("Login process completed.");
          })
          .catch(err => {
            this.allMyData.logError(this.tabName, "server", "createOrUpdatePersonWithFacebookInfo function error: Err msg = " + err, this.http);
            reject(err);
          });
        } else if (response.status === 'not_authorized') {
          // the user is logged in to Facebook, 
          // but has not authenticated your app
          this.allMyData.logError(this.tabName, "login", "The user is logged in to Facebook, but has not authenticated your app.", this.http);
          reject("User hasn't authenticated app - whatever that means...");
        } else {
          // the user isn't logged in to Facebook.
          this.fb.login(['public_profile', 'user_friends'])
          .then((response: FacebookLoginResponse) => {
            let accessToken = response.authResponse.accessToken;
            this.createOrUpdatePersonWithFacebookInfo(accessToken)
            .then((res) => {
              resolve("Login process completed.");
            })
            .catch(err => {
              this.allMyData.logError(this.tabName, "server", "createOrUpdatePersonWithFacebookInfo function error: Err msg = " + err, this.http);
              reject(err);
            });
          })
          .catch(err => {
            this.allMyData.logError(this.tabName, "login", "Error logging into Facebook : Err msg = " + err, this.http);
            this.logout()
            .then((response: FacebookLoginResponse) => {
              this.fb.login(['public_profile', 'user_friends'])
              .then((response: FacebookLoginResponse) => {
                let accessToken = response.authResponse.accessToken;
                this.createOrUpdatePersonWithFacebookInfo(accessToken)
                .then((res) => {
                  resolve("Login process completed.");
                })
                .catch(err => {
                  this.allMyData.logError(this.tabName, "server", "Error with createOrUpdatePersonWithFacebookInfo function : Err msg = " + err, this.http);
                  reject(err);
                });
              })
              .catch(err => {
                this.allMyData.logError(this.tabName, "login", "We tried logging the user out of Facebook and trying to log them in again, but it didn't work. : Err msg = " + err, this.http);
                reject(err);
              });
            })
            .catch(err => {
              this.allMyData.logError(this.tabName, "login", "Error logging out of Facebook : Err msg = " + err, this.http);
              reject(err);
            });
          });
        }
      })
      .catch(err => {
        this.allMyData.logError(this.tabName, "login", "Error checking status of login : Err msg = " + err, this.http);
        reject(err);
      });
    });
  }

  public logout(){
    return new Promise((resolve, reject) => {
      this.fb.logout()
      .then((response: FacebookLoginResponse) => {
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
        reject(e);
      });
    });
  }

  createOrUpdatePersonWithFacebookInfo(accessToken : string){
    return new Promise((resolve, reject) => {
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