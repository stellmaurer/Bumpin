/*******************************************************
 * Copyright (C) 2018 Stephen Ellmaurer <stellmaurer@gmail.com>
 * 
 * This file is part of the Bumpin mobile app project.
 * 
 * The Bumpin project and any of the files within the Bumpin
 * project can not be copied and/or distributed without
 * the express permission of Stephen Ellmaurer.
 *******************************************************/

export class PushNotification {

    public expiresAt : number;
    public hasBeenSeen : boolean;
    public message : string;
    public notificationID : string;
    public partyOrBarID : string;
    public receiverFacebookID : string;

    constructor() {}
}