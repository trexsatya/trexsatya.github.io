(function(app) {

  var ActiveLabelComponent = ng.core.Component({
    selector: 'active-label',
    template: '<span class="active-label"' +
                    '*ngIf="active">' +
      'Active' +
    '</span>'
  }).Class({
    constructor: [function() { }],
    activate: function() {
      this.active = true;
    }
  });

  var HeroComponent = ng.core.Component({
    selector: 'a-hero',
    template: '<h2 [class.active]=active>' +
      '{{hero.name}} ' +
      '<ng-content></ng-content>' +
    '</h2>',
    inputs: ['hero'],
    queries: {
      label: new ng.core.ContentChild(
                   ActiveLabelComponent)
    }
  }).Class({
    constructor: [function() { }],
    activate: function() {
      this.active = true;
      this.label.activate();
    }
  });
  app.HeroQueriesComponent = HeroComponent;

  var AppComponent = ng.core.Component({
    selector: 'heroes-queries',
    template:
      '<a-hero *ngFor="let hero of heroData"' +
            '[hero]="hero">' +
        '<active-label></active-label>' +
      '</a-hero>' +
      '<button (click)="activate()">' +
        'Activate' +
      '</button>',    
    queries: {
      heroCmps: new ng.core.ViewChildren(
                      HeroComponent)
    }
  }).Class({
    constructor: function() {
      this.heroData = [
        {id: 1, name: 'Windstorm'},
        {id: 2, name: 'Superman'}
      ];
    },
    activate: function() {
      this.heroCmps.forEach(function(cmp) {
        cmp.activate();
      });
    }
  });

  app.HeroesQueriesModule =
    ng.core.NgModule({
      imports: [ ng.platformBrowser.BrowserModule ],
      declarations: [
        AppComponent,
        HeroComponent,
        ActiveLabelComponent
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