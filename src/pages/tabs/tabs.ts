/*******************************************************
 * Copyright (C) 2018 Stephen Ellmaurer <stellmaurer@gmail.com>
 * 
 * This file is part of the Bumpin mobile app project.
 * 
 * The Bumpin project and any of the files within the Bumpin
 * project can not be copied and/or distributed without
 * the express permission of Stephen Ellmaurer.
 *******************************************************/

import { Component, NgZone, ViewChild } from '@angular/core';
import { FindPage } from '../find/find'
import { CheckInPage } from '../rate/check-in';
import { HostPage } from '../host/host';
import { MorePage } from '../more/more';
import { Events, Tabs } from '../../../node_modules/ionic-angular';

@Component({
  selector: 'page-tabs',
  templateUrl: 'tabs.html'
})
export class TabsPage {
  // this tells the tabs component which Pages
  // should be each tab's root Page
  tab1Root: any = FindPage;
  tab2Root: any = CheckInPage;
  tab3Root: any = HostPage;
  tab4Root: any = MorePage;

  @ViewChild('myTabs') tabRef: Tabs;

  constructor(private events: Events, private zone: NgZone) {
    
  }

  ngOnInit(){
    this.events.subscribe("overlayIsNowActive",() => {
      this.increaseTabBarTransparency();
    });
    this.events.subscribe("overlayIsNowInactive",() => {
      this.makeTabBarCompletelyOpaque();
    });
    document.getElementsByClassName("tabbar")[0].addEventListener("click", () => {
      console.log("tabBarWasClicked");
      if(this.tabRef.getSelected().index == 0){
        this.events.publish("tabBarWasClicked");
      }
    });
  }

  increaseTabBarTransparency(){
    let tabBar = document.getElementsByClassName("tabbar");
    for(let i = 0; i < tabBar.length; i++){
      tabBar[i].classList.add("opacityWhenOverlayIsActive");
    }
  }

  makeTabBarCompletelyOpaque(){
    let tabBar = document.getElementsByClassName("tabbar");
    for(let i = 0; i < tabBar.length; i++){
      tabBar[i].classList.remove("opacityWhenOverlayIsActive");
    }
  }
}
