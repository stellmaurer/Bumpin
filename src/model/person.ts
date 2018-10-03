/*******************************************************
 * Copyright (C) 2018 Stephen Ellmaurer <stellmaurer@gmail.com>
 * 
 * This file is part of the Bumpin mobile app project.
 * 
 * The Bumpin project and any of the files within the Bumpin
 * project can not be copied and/or distributed without
 * the express permission of Stephen Ellmaurer.
 *******************************************************/

export class Person {

    public barHostFor : Map<string,boolean>;
    public facebookID : string;
    public invitedTo : Map<string,boolean>;
    public isMale : boolean;
    public name : string;
    public partyHostFor : Map<string,boolean>;
    public peopleBlockingTheirActivityFromMe : Map<string,boolean>;
    public peopleToIgnore : Map<string,boolean>;
    public status : Map<string,string>;
    public platform : string;
    public deviceToken : string;
    public numberOfFriendsThatMightGoOut : number;
    public sevenPMLocalHourInZulu : number;
    public whatGotThemToDownload : string;
    public version : string;
    public pointMap : Map<string,any>;

    constructor() {
        this.facebookID = "Not yet set.";
        this.isMale = true;
        this.name = "Not yet set.";
        this.platform = "Not yet set.";
        this.deviceToken = "Not yet set.";
        this.barHostFor = new Map<string,boolean>();
        this.invitedTo = new Map<string,boolean>();
        this.partyHostFor = new Map<string,boolean>();
        this.peopleBlockingTheirActivityFromMe = new Map<string,boolean>();
        this.peopleToIgnore = new Map<string,boolean>();
        this.status = new Map<string,string>();
        this.numberOfFriendsThatMightGoOut = 0;
        this.sevenPMLocalHourInZulu = 0;
        this.whatGotThemToDownload = "Not yet set.";
        this.version = "Not yet set.";
        this.pointMap = new Map<string,any>();
    }

    fixMaps(){
        this.fixStatusMap();
        this.fixPointMap();
        this.fixPartyHostForMap();
        this.fixBarHostForMap();
        this.fixInvitedToMap();
    }

    private fixStatusMap(){
        if(this.status == null){
            this.status = new Map<string,string>();
        }else{
            let fixedStatusMap = new Map<string,string>();
            let status = this.status;
            Object.keys(status).forEach(function (key) {
                fixedStatusMap.set(key, status[key]);
            });
            this.status = fixedStatusMap;
        }
    }

    private fixPointMap(){
        if(this.pointMap == null){
            this.pointMap = new Map<string,any>();
        }else{
            let fixedPointMap = new Map<string,any>();
            let pointMap = this.pointMap;
            Object.keys(pointMap).forEach(function (key) {
                fixedPointMap.set(key, pointMap[key]);
            });
            this.pointMap = fixedPointMap;
        }
    }

    private fixPartyHostForMap(){
        if(this.partyHostFor == null){
            this.partyHostFor = new Map<string,boolean>();
        }else{
            let fixedPartyHostForMap = new Map<string,boolean>();
            let partyHostFor = this.partyHostFor;
            Object.keys(partyHostFor).forEach(function (key) {
                fixedPartyHostForMap.set(key, partyHostFor[key]);
            });
            this.partyHostFor = fixedPartyHostForMap;
        }
    }

    private fixBarHostForMap(){
        if(this.barHostFor == null){
            this.barHostFor = new Map<string,boolean>();
        }else{
            let fixedBarHostForMap = new Map<string,boolean>();
            let barHostFor = this.barHostFor;
            Object.keys(barHostFor).forEach(function (key) {
                fixedBarHostForMap.set(key, barHostFor[key]);
            });
            this.barHostFor = fixedBarHostForMap;
        }
    }

    private fixInvitedToMap(){
        if(this.invitedTo == null){
            this.invitedTo = new Map<string,boolean>();
        }else{
            let fixedInvitedToMap = new Map<string,boolean>();
            let invitedTo = this.invitedTo;
            Object.keys(invitedTo).forEach(function (key) {
                fixedInvitedToMap.set(key, invitedTo[key]);
            });
            this.invitedTo = fixedInvitedToMap;
        }
    }
}
/*
export class PointStruct {
    public points : number;
    public pointsUserStartedOffWithToday : number;
    public timeUserGotFirstPointsOfDay : string;
    public hasFreeDrink : boolean;
    constructor() {}
}
*/