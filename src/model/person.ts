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

    constructor() {}
}