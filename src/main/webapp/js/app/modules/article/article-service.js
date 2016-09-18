angular.module('app.articles.service', [

])

// A RESTful factory for retrieving articles from 'articles.json'
.factory('articles', ['$http', '$q', function ($http, $q, utils) {
  var path = 'assets/articles.json';
  

  var factory = {};
  factory.all = function () {

  };
  
  return factory;
}]);
