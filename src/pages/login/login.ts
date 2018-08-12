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
import { Friend } from '../../model/friend';

@Injectable()
export class Login {

  private tabName : string = "More Tab";

  constructor(private allMyData : AllMyData, private http:Http, private events : Events, private fb : Facebook) {}

  // use this by making function that uses it async, and then:
  //          await this.sleep(10000);
  private sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public login(){
    return new Promise((resolve, reject) => {
      this.fb.getLoginStatus()
      .then((response: FacebookLoginResponse) => {
        if (response.status === 'connected') {
          console.log("response.status = connected");
          // the user is logged in and has authenticated your
          // app, and response.authResponse supplies
          // the user's ID, a valid access token, a signed
          // request, and the time the access token 
          // and signed request each expire
          let accessToken = response.authResponse.accessToken;
          console.log("access_token=" + accessToken);
          this.allMyData.facebookAccessToken = accessToken;
          this.createOrUpdatePersonWithFacebookInfo(accessToken)
          .then((res) => {
            resolve("Login process completed.");
          })
          .catch(err => {
            this.allMyData.logError(this.tabName, "server", "createOrUpdatePersonWithFacebookInfo function error: Err msg = " + err, this.http);
            reject(err);
          });
        } else if (response.status === 'not_authorized') {
          console.log("response.status = not authorized");
          // the user is logged in to Facebook, 
          // but has not authenticated your app
          this.allMyData.logError(this.tabName, "login", "The user is logged in to Facebook, but has not authenticated your app.", this.http);
          this.fb.login(['public_profile', 'user_friends'])
          .then((response: FacebookLoginResponse) => {
            let accessToken = response.authResponse.accessToken;
            this.allMyData.facebookAccessToken = accessToken;
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
            reject(err);
          });
          //reject("User hasn't authenticated app - whatever that means...");
        } else {
          console.log("response.status = not connected");
          // the user isn't logged in to Facebook.
          this.fb.login(['public_profile', 'user_friends'])
          .then((response: FacebookLoginResponse) => {
            let accessToken = response.authResponse.accessToken;
            this.allMyData.facebookAccessToken = accessToken;
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
            reject(err);
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
      this.allMyData.storage.set("myFriends", null);
      this.allMyData.storage.set("myFacebookID", null);
      this.allMyData.storage.set("myGenderIsMale", null);
      this.allMyData.storage.set("myName", null);

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
      resolve("Login process completed.");
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

  public populateFacebookInfoFromLocalStorage(){
    return new Promise((resolve, reject) => {
        Promise.all([this.allMyData.storage.get("myFacebookID"), this.allMyData.storage.get("myGenderIsMale"),
                     this.allMyData.storage.get("myName"), this.allMyData.storage.get("friends")])
        .then(data => {
            let myFacebookID : string = data[0];
            let myGenderIsMale : boolean = data[1];
            let myName : string = data[2];
            let friends : Friend[] = data[3];
            if(myFacebookID != null && myGenderIsMale != null && myName != null && friends != null){
                this.allMyData.me.facebookID = myFacebookID;
                this.allMyData.me.isMale = myGenderIsMale;
                this.allMyData.me.name  = myName;
                this.allMyData.friends = friends;
                this.allMyData.friends.sort(function(a, b){
                  if(b.name < a.name){
                      return 1;
                  }
                  if(b.name > a.name){
                      return -1;
                  }
                  return 0;
                });
                resolve("successfully got Facebook info from local storage");
            }else{
                reject("facebook info not in local storage yet");
            }
        })
        .catch((err) => {
            reject(err);
        });
    });
  }
}