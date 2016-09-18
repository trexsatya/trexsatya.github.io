	// create the module and name it app
	var app = angular.module('app', ['app.articles.service','ngAnimate','ui.router','ui.bootstrap', 'uiRouterStyles',
	                                 'ngWig']);

	app.config(['ngWigToolbarProvider', function (ngWigToolbarProvider) {
        ngWigToolbarProvider.setButtons(['formats', 'list1', 'list2', 'bold', 'italic', 'link']);
        ngWigToolbarProvider.addStandardButton('underline', 'Underline', 'underline', 'fa-underline');
      }]);
      
	app.config(function($stateProvider, $urlRouterProvider) {
	    
	    $stateProvider
	    
	        .state('home', {
	        	url : '/home',
	        	templateUrl : 'html/home.html'
	        })
	        .state('about', {
	        	url : '/about',
	        	templateUrl : 'html/about.html'
	        })
	        .state('contact', {
	        	url : '/contact',
	        	templateUrl : 'html/contact.html'
	        })
	        // route to show our basic form (/learn)
	        .state('learn', {
	            url: '/learn',
	            templateUrl: 'html/learn/learn.html',
	            controller: 'learnController',
	        })
	        
	        // nested states 
	        // each of these sections will have their own view
	        // url will be nested (/learn/level)
	        .state('learn.level', {
	            url: '/level',
	            onEnter: function($stateParams, $state, $uibModal) {
	                var modalInstance = $uibModal.open({
	                    templateUrl: "html/learn/level.html",
	                    resolve: {
	                     
	                    },
	                    controller: function($scope, $uibModalInstance){
	                    	$scope.btnStyle = { width: '100%' , 'margin-bottom' : '2%'}
	                		
	                		$scope.close = function(){
	                    		$uibModalInstance.close()
	                		}
	                    },
//	                    data: { //This is for uiRouterStyle //TODO
//	    	                css: 'html/learn/level.css'
//	    	            }
	                    
	                });
	                modalInstance.result.finally(function() {
	                    $state.go('^');
	                });
	            },
	            onExit: ['$stateParams', '$state', '$uibModal', function($stateParams, $state, $modal) { 
//	            	$modal.close({ value : ''})
	            }]
	        })
	        
	        .state('article', {
	        	url: '/articles',
	        	template : '<ui-view/>',
	        	controller: 'articleController',
	        	abstract: true,
	        	resolve: {
	        		articles : ['articles','$q','$timeout',function(articles, $q, $timeout){
	                    var deferred = $q.defer();
	                    var mockArticles = [{
	                        id: 1,
	                        name: "test article"
	                    }];
	                    
	                    $timeout(function() {
	                        deferred.resolve(mockArticles);
	                    }, 1000);
	                    return deferred.promise;
	                }]
	        	},
	        	onEnter: function($stateParams, $state){
	        		console.log("entered article")
	        	}
	        })
	        .state('article.list', {
	        	url: '', //This will become active as soon as parent state is navigated.
	        	templateUrl : '/html/article/list.html',
	        	controller: function($scope, articles){
	        		console.log(articles)
	        		$scope.articles = articles
	        	}
	        })
	        .state('article.detail', {
	        	url: '/:id',
	        	name: 'articleDetail',
	        	templateUrl : '/html/article/detail.html',
	        	onEnter: function(){
	        		console.log('details')
	        	}
	        })
	        
	    // catch all route
	    // send users to the form page 
	    $urlRouterProvider.when('/','/learn')    
//	                      .when('/home','/learn');    
	    $urlRouterProvider.otherwise('/');
	});
	
	// create the controller and inject Angular's $scope
	app.controller('mainController', function($scope) {
		// create a message to display in our view
		$scope.message = 'Everyone come and see how good I look!';
	});

	app.controller('learnController', function($scope) {
		var learn =  {};
		learn['what'] = 'Java'
		learn['level'] = 0

	});
	
	app.controller('aboutController', function($scope) {
		$scope.message = 'Look! I am an about page.';
	});

	app.controller('contactController', function($scope) {
		$scope.message = 'Contact us! JK. This is just a demo.';
	});
	
	app.controller('articleController', function($scope) {
		$scope.message = 'Contact us! JK. This is just a demo.';
	});