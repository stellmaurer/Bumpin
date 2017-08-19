
export class Person {

    public barHostFor : Map<string,boolean>;
    public facebookID : string;
    public invitedTo : Map<string,boolean>;
    public isMale : boolean;
    public name : string;
    public partyHostFor : Map<string,boolean>;
    public peopleBlockingTheirActivityFromMe : Map<string,boolean>;
    public peopleToIgnore : Map<string,boolean>;

    constructor() {}
}