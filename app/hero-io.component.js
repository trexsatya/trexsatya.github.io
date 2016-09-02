(function(app) {
  var ConfirmComponent = ng.core.Component({
    selector: 'my-confirm',
    inputs: [
      'okMsg',
      'notOkMsg: cancelMsg'
    ],
    outputs: [
      'ok',
      'notOk: cancel'
    ],
    template:
      '<button (click)="onOkClick()">' +
        '{{okMsg}}' +
      '</button>' +
      '<button (click)="onNotOkClick()">' +
        '{{notOkMsg}}' +
      '</button>'
  }).Class({
    constructor: function() {
      this.ok = new ng.core.EventEmitter();
      this.notOk = new ng.core.EventEmitter();
    },
    onOkClick: function() {
      this.ok.next(true);
    },
    onNotOkClick: function() {
      this.notOk.next(true);
    }
  });

  function AppComponent() {
  }
  AppComponent.annotations = [
    new ng.core.Component({
      selector: 'hero-io',
      template: '<my-confirm [okMsg]="\'OK\'"' +
        '[cancelMsg]="\'Cancel\'"' +
        '(ok)="onOk()"' +
        '(cancel)="onCancel()">' +
        '</my-confirm>' +
        '<span *ngIf="okClicked">OK clicked</span>' +
        '<span *ngIf="cancelClicked">Cancel clicked</span>'
    })
  ];
  AppComponent.prototype.onOk = function() {
    this.okClicked = true;
  }
  AppComponent.prototype.onCancel = function() {
    this.cancelClicked = true;
  }

  app.HeroesIOModule =
    ng.core.NgModule({
      imports: [ ng.platformBrowser.BrowserModule ],
      declarations: [
        AppComponent,
        ConfirmComponent
      ],
      bootstrap: [ AppComponent ]
    })
    .Class({
      constructor: function() {}
    });

})(window.app = window.app || {});


/*
Copyright 2016 Google Inc. All Rights Reserved.
Use of this source code is governed by an MIT-style license that
can be found in the LICENSE file at http://angular.io/license
*/