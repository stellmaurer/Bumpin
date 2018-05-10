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
import { FindPage } from '../find/find'
import { RatePage } from '../rate/rate';
import { HostPage } from '../host/host';
import { MorePage } from '../more/more';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {
  // this tells the tabs component which Pages
  // should be each tab's root Page
  tab1Root: any = FindPage;
  tab2Root: any = RatePage;
  tab3Root: any = HostPage;
  tab4Root: any = MorePage;

  constructor() {
    console.log("tabs.ts: in constructor");
  }
}
