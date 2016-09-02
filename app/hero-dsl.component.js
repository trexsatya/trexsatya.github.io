(function(app) {

  var HeroComponent = ng.core.Component({
      selector: 'hero-view-2',
      template:
        '<h1>Name: {{getName()}}</h1>',
    })
    .Class({
      constructor: function() {
      },
      getName: function() {
        return 'Windstorm';
      }
    });

  app.HeroesDslModule =
    ng.core.NgModule({
      imports: [ ng.platformBrowser.BrowserModule ],
      declarations: [ HeroComponent ],
      bootstrap: [ HeroComponent ]
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