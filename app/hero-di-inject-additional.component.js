(function(app) {

  var TitleComponent = ng.core.Component({
    selector: 'hero-title',
    template:
      '<h1>{{titlePrefix}} {{title}}</h1>' +
      '<button (click)="ok()">OK</button>' +
      '<p>{{ msg }}</p>'
  }).Class({
    constructor: [
      [
        new ng.core.Optional(),
        new ng.core.Inject('titlePrefix')
      ],
      new ng.core.Attribute('title'),
      function(titlePrefix, title) {
        this.titlePrefix = titlePrefix;
        this.title  = title;
        this.msg = '';
      }
    ],
    ok: function() {
      this.msg = 'OK!';
    }
  });

  var AppComponent = ng.core.Component({
    selector: 'hero-di-inject-additional',
    template: '<hero-title title="Tour of Heroes">' +
    '</hero-title>'
  }).Class({
    constructor: function() { }
  });
 
  app.HeroesDIInjectAdditionalModule =
    ng.core.NgModule({
      imports: [ ng.platformBrowser.BrowserModule ],
      declarations: [
        AppComponent,
        TitleComponent
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