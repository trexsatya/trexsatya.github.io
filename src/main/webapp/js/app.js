;(function(angular) {

    'use strict';

    // Options for Phonon
    phonon.options({
        navigator: {
            defaultPage: 'home',
            hashPrefix: '/!', // important! Use AngularJS's URL manipulation
            animatePages: true,
            enableBrowserBackButton: true,
            templateRootDirectory: './tpl'
        },
        i18n: null // for this example, we do not use internationalization
    });

    var myApp = angular.module('myApp', ['pagetwo']);  

    /**
     * Home's Controller
    */
	myApp.controller('DrawerCtrl', ['$scope', function DrawerCtrl($scope) {

        $scope.pageName = 'Phonon + AngularJS';
        $scope.options = [
        	{name: 'Profile', url: '#/!pagetwo/profile'},
        	{name: 'About', url: '#/!pagetwo/about'},
        	{name: 'Settings', url: '#/!pagetwo/settings'},
        	{name: 'Login', url: '#/!pagetwo/login'},
        ];

        /**
         * The activity scope is not mandatory.
         * For the home page, we do not need to perform actions during
         * page events such as onCreate, onReady, etc
        */
        phonon.navigator().on({page: 'home', preventClose: false, content: null});

	}]);

    

	/**
	 * Starts the app when AngularJS has finished to load/compile page templates
	 */
    myApp.directive('ngReady', [function() {
        return {
            priority: Number.MIN_SAFE_INTEGER, // execute last, after all other directives if any.
            restrict: 'A',
            link: function() {
				phonon.navigator().start();	
            }
        };
    }]);

})(window.angular);