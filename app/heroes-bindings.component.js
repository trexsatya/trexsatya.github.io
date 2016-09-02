(function(app) {

  var HeroesComponent = ng.core.Component({
    selector: 'heroes-bindings',
    template: '<h1 [class.active]="active">' +
      'Tour of Heroes' +
    '</h1>',
    host: {
      '[title]': 'title',
      '[class.heading]': 'hClass',
      '(click)': 'clicked()',
      '(dblclick)': 'doubleClicked($event)'
    }
  }).Class({
    constructor: function() {
      this.title = 'Tooltip content';
      this.hClass = true;
    },
    clicked: function() {
      this.active = !this.active;
    },
    doubleClicked: function(evt) {
      this.active = true;
    }
  });

  app.HeroesHostBindingsModule =
    ng.core.NgModule({
      imports: [ ng.platformBrowser.BrowserModule ],
      declarations: [ HeroesComponent ],
      bootstrap: [ HeroesComponent ]
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