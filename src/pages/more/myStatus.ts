/*******************************************************
 * Copyright (C) 2018 Stephen Ellmaurer <stellmaurer@gmail.com>
 * 
 * This file is part of the Bumpin mobile app project.
 * 
 * The Bumpin project and any of the files within the Bumpin
 * project can not be copied and/or distributed without
 * the express permission of Stephen Ellmaurer.
 *******************************************************/

import { Component } from '@angular/core';
import { AllMyData} from '../../model/allMyData';
import { Http } from '@angular/http';


@Component({
  selector: 'page-myStatus',
  templateUrl: 'myStatus.html'
})
export class MyStatusPage {
    private tabName: string = "More Tab";

    constructor(private http:Http, public allMyData : AllMyData) {
        
    }

    private changeStatus(status : string){
        this.allMyData.changeMyGoingOutStatus(status, "Yes", this.http)
        .then((res) => {
            
        })
        .catch((err) => {
            this.allMyData.logError(this.tabName, "server", "changeMyGoingOutStatus query error : Err msg = " + err, this.http);
        });
    }
}
