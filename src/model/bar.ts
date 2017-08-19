import {Type} from "serializer.ts/Decorators";

export class Bar {
    public addressLine1 : string;
    public addressLine2 : string;
    public attendees : Map<string, Attendee>;
    public barID : string;
    public city : string;
    public country : string;
    public details : string;
    public hosts : Map<string,Host>;
    public latitude : number;
    public longitude : number;
    public name : string;
    public phoneNumber : string;
    public schedule : Map<string,Schedule>;
    public stateProvinceRegion : string;
    public zipCode : number;

    constructor() {}
}

class Attendee {
    public isMale : boolean;
    public name : string;
    public rating : string;
    public status : string;
    public timeLastRated : string;
    constructor() {}
}

class Host {
    public isMainHost : boolean;
    public name : string;
    public status : string;
    constructor() {}
}

class Schedule {
    public lastCall : string;
    public open : string;
    constructor() {}
}