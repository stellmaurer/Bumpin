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

    constructor() {}

    fixMaps(){
        this.fixPartyHostForMap();
        this.fixBarHostForMap();
        this.fixInvitedToMap();
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