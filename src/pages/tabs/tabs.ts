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

  }
}
