(function(app) {

  function HeroComponent() {
    this.title = "Hero Detail";
  }
  
  HeroComponent.annotations = [
    new ng.core.Component({
      selector: 'hero-view',
      template:
        '<h1>Hero: {{getName()}}</h1>'
    })
  ];
  HeroComponent.prototype.getName =
    function() {return 'Windstorm';};

  app.HeroesModule =
    ng.core.NgModule({
      imports: [ ng.platformBrowser.BrowserModule ],
      declarations: [ HeroComponent ],
      bootstrap: [ HeroComponent ]
    })
    .Class({
      constructor: function() {}
    });

  app.HeroComponent = HeroComponent;

})(window.app = window.app || {});


/*
Copyright 2016 Google Inc. All Rights Reserved.
Use of this source code is governed by an MIT-style license that
can be found in the LICENSE file at http://angular.io/license
*/