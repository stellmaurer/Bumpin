import {Party} from "./party";
import {Bar} from "./bar";

export class Utility {

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