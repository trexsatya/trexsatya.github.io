(function(app) {

  app.HeroDIComponent = HeroComponent;
  
  function HeroComponent(dataService) {
    this.name = dataService.getHeroName();
  }
  HeroComponent.parameters = [
    app.DataService
  ];
  HeroComponent.annotations = [
    new ng.core.Component({
      selector: 'hero-di',
      template: '<h1>Hero: {{name}}</h1>'
    })
  ];

  app.HeroesDIModule =
    ng.core.NgModule({
      imports: [ ng.platformBrowser.BrowserModule ],
      providers: [ app.DataService ],
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