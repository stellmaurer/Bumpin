/*******************************************************
 * Copyright (C) 2018 Stephen Ellmaurer <stellmaurer@gmail.com>
 * 
 * This file is part of the Bumpin mobile app project.
 * 
 * The Bumpin project and any of the files within the Bumpin
 * project can not be copied and/or distributed without
 * the express permission of Stephen Ellmaurer.
 *******************************************************/

import {Party} from "./party";
import {Bar} from "./bar";

export class Utility {

    public static partyIsCurrentlyInProgress(party : Party){
        let partyStartTime = new Date(party.startTime).getTime();
        let partyEndTime = new Date(party.endTime).getTime();
        let rightNow = new Date().getTime();
        if((partyStartTime <= rightNow) && (rightNow <= partyEndTime)){
          return true;
        }
        return false;
      }

    public static hasThisPartyStarted(party : Party) : boolean {
        var partyHasStarted = false;
        if(party == null){
            return false;
        }
        var timeOfPartyInMilliseconds = Date.parse(party.startTime);
        var rightNow = new Date();
        var rightNowInMilliseconds = rightNow.getTime();
        if( rightNowInMilliseconds >= timeOfPartyInMilliseconds){
            partyHasStarted = true;
        }
        return partyHasStarted;
    }

    public static isPartyToday(party : Party){
        var partyIsToday = false;
        if(party == null){
            return partyIsToday;
        }
        var timeOfPartyInMilliseconds = Date.parse(party.startTime);
        var todayRightBeforeMidnight = new Date();
        todayRightBeforeMidnight.setHours(23);
        todayRightBeforeMidnight.setMinutes(59);
        var timeRightBeforeMidnightInMilliseconds = todayRightBeforeMidnight.getTime();
        if((timeRightBeforeMidnightInMilliseconds - timeOfPartyInMilliseconds) >= 0){
            partyIsToday = true;
        }
        return partyIsToday;
    }

    public static isPartyThisWeek(party : Party){
        var partyIsThisWeek = false;
        if(party == null){
            return partyIsThisWeek;
        }
        var currentTimeInMilliseconds = new Date().getTime();
        var aWeekFromNowInMilliseconds = currentTimeInMilliseconds + 604800000; // 604,800,000 milliseconds is eqaul to one week
        var timeOfPartyInMilliseconds = Date.parse(party.startTime);
        if((aWeekFromNowInMilliseconds - timeOfPartyInMilliseconds) >= 0){
            partyIsThisWeek= true;
        }
        return partyIsThisWeek;
    }

    public static isGoingOutStatusExpired(timeGoingOutStatusWasSet : string){
        if(timeGoingOutStatusWasSet == null){
            return true;
        }
        var today = new Date();
        var dateThatStatusWasSet = new Date(timeGoingOutStatusWasSet);
        var goingOutStatusIsExpired = false;
        if(today.getFullYear() == dateThatStatusWasSet.getFullYear() &&
           today.getMonth() == dateThatStatusWasSet.getMonth() &&
           today.getDate() == dateThatStatusWasSet.getDate()){
            goingOutStatusIsExpired = false;
        }else{
            goingOutStatusIsExpired = true;
        }
        return goingOutStatusIsExpired;
    }

    public static isRatingExpired(timeLastRated : string){
        if(timeLastRated == null){
            return true;
        }
        var currentTimeInMilliseconds = new Date().getTime();
        var timeLastRatedInMilliseconds = Date.parse(timeLastRated);
        var ratingIsExpired = false;
        if((currentTimeInMilliseconds - timeLastRatedInMilliseconds) > 1800000){ // 1,800,000 milliseconds is 30 minutes
            ratingIsExpired = true;
        }
        return ratingIsExpired;
    }

    public static isAttendanceExpired(timeOfLastKnownLocation : string){
        if(timeOfLastKnownLocation == null){
            return true;
        }
        var currentTimeInMilliseconds = new Date().getTime();
        var timeOfLastKnownLocationInMilliseconds = Date.parse(timeOfLastKnownLocation);
        var attendanceIsExpired = false;
        if((currentTimeInMilliseconds - timeOfLastKnownLocationInMilliseconds) > 1800000){ // 1,800,000 milliseconds is 30 minutes
            attendanceIsExpired = true;
        }
        return attendanceIsExpired;
    }

    public static getDistanceInMetersBetweenCoordinates(lat1 : number, lng1 : number, lat2 : number, lng2 : number){
        var R = 6371e3; // metres
        var φ1 = this.toRad(lat1);
        var φ2 = this.toRad(lat2);
        var Δφ = this.toRad(lat2-lat1);
        var Δλ = this.toRad(lng2-lng1);

        var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        var d = R * c;
        return d;
    }

    private static toRad(x) {
        return x * Math.PI / 180;
    }

    // ISO Format = 2017-03-04T00:57:00Z
    public static convertDateTimeToISOFormat(date: Date){
        var year = date.getUTCFullYear();
        var month = (date.getUTCMonth()+1).toString().length == 1 ? '0'+(date.getUTCMonth()+1) : (date.getUTCMonth()+1);
        var day = date.getUTCDate().toString().length == 1 ? '0'+date.getUTCDate() : date.getUTCDate();
        var hour = date.getUTCHours().toString().length == 1 ? '0'+date.getUTCHours() : date.getUTCHours();
        var minutes = date.getUTCMinutes().toString().length == 1 ? '0'+date.getUTCMinutes() : date.getUTCMinutes();
        var seconds = date.getUTCSeconds().toString().length == 1 ? '0'+date.getUTCSeconds() : date.getUTCSeconds();
        return year + "-" + month + "-" + day + "T" + hour + ":" + minutes + ":" + seconds + "Z"; 
    }

    public static convertTimeToLocalTimeAndFormatForUI(date: Date){
        var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        var militaryHour = date.getHours();

        var dayName = days[date.getDay()];
        var monthName = months[date.getMonth()];
        var dayNumber = date.getDate();
        var year = date.getFullYear();
        var hour = militaryHour < 13 ? militaryHour : militaryHour - 12;
        var minutes = date.getMinutes().toString().length == 1 ? '0'+date.getMinutes() : date.getMinutes();
        var ampm = militaryHour < 12 ? "AM" : "PM";

        return hour + ":" + minutes + " " + ampm + " " + dayName + ", " + monthName + "-" + dayNumber + "-" + year;
    }

    public static findIndexOfParty(party : Party, parties : Party[])
    {
        for(let i = 0; i < parties.length; i++){
            if(parties[i].partyID == party.partyID){
                return i;
            }
        }
        return -1;
    }

    public static findIndexOfBar(bar : Bar, bars : Bar[])
    {
        for(let i = 0; i < bars.length; i++){
            if(bars[i].barID == bar.barID){
                return i;
            }
        }
        return -1;
    }
}