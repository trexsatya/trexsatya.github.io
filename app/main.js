(function(app) {

  var platformBrowserDynamic =
    ng.platformBrowserDynamic.platformBrowserDynamic;
  var LocationStrategy =
    ng.common.LocationStrategy;
  var HashLocationStrategy =
    ng.common.HashLocationStrategy;

  var HeroComponent = app.HeroComponent;

  document.addEventListener('DOMContentLoaded', function() {
    platformBrowserDynamic().bootstrapModule(app.HeroesModule);
    platformBrowserDynamic().bootstrapModule(app.HeroesDslModule);
    platformBrowserDynamic().bootstrapModule(app.HeroesLifecycleModule);
    platformBrowserDynamic().bootstrapModule(app.HeroesDIModule);
    platformBrowserDynamic().bootstrapModule(app.HeroDIInlineModule);
    platformBrowserDynamic().bootstrapModule(app.HeroesDIInjectModule);
    platformBrowserDynamic().bootstrapModule(app.HeroesDIInjectModule2);
    platformBrowserDynamic().bootstrapModule(app.HeroesDIInjectAdditionalModule);
    platformBrowserDynamic().bootstrapModule(app.HeroesIOModule);
    platformBrowserDynamic().bootstrapModule(app.HeroesHostBindingsModule);
    platformBrowserDynamic().bootstrapModule(app.HeroesQueriesModule);
  });

})(window.app = window.app || {});


/*
Copyright 2016 Google Inc. All Rights Reserved.
Use of this source code is governed by an MIT-style license that
can be found in the LICENSE file at http://angular.io/license
*/