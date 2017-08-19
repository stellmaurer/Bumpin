import { Component } from '@angular/core';
import {ViewController,NavParams, NavController} from 'ionic-angular';
import {Bar} from "../../model/bar";

@Component({
  selector: 'page-barPopover',
  templateUrl: 'barPopover.html'
})

export class BarPopover {
  public bar : Bar;

  static get parameters() {
    return [[ViewController],[NavParams]];
  }

  constructor(public viewCtrl: ViewController, params : NavParams) {
    this.bar = params.get("bar");
  }

  close() {
    this.viewCtrl.dismiss();
  }
}