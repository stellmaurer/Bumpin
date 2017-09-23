import {Party} from "./party";
import {AllMyData} from "./allMyData";

export class Utility {

    constructor(private allMyData : AllMyData) {
        
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
}