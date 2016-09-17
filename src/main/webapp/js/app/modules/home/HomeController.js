;(function(angular) {

    'use strict';
    /**
     * PageTwo's Controller
    */
    var myApp = angular.module('pagetwo', []);
    
	myApp.controller('PageTwoCtrl', ['$scope', function HomeCtrl($scope) {   

        $scope.pageName = 'Page Two';

        /**
         * However, on the second page, we want to define the activity scope.
         * [1] On the create callback, we add tap events on buttons. The OnCreate callback is called once.
         * [2] If the user does not tap on buttons, we cancel the page transition. preventClose => true
         * [3] The OnReady callback is called every time the user comes on this page,
         * here we did not implement it, but if you do, you can use readyDelay to add a small delay
         * between the OnCreate and the OnReady callbacks
        */
		phonon.navigator().on({page: 'pagetwo', preventClose: true, content: null, readyDelay: 1}, function(activity) {

		    var action = null;

		    var onAction = function(evt) {
		        var target = evt.target;
		        action = 'ok';
		        
		        if(target.getAttribute('data-order') === 'order') {
		            phonon.alert('Thank you for your order!', 'Dear customer');

		        } else {
		            phonon.alert('Your order has been canceled.', 'Dear customer');
		        }
		    };

		    activity.onCreate(function() {
		        document.querySelector('.order').on('tap', onAction);
		        document.querySelector('.cancel').on('tap', onAction);
		    });

		    activity.onClose(function(self) {
		        if(action !== null) {
		            self.close();
		        } else {
		            phonon.alert('Before leaving this page, you must perform an action.', 'Action required');
		        }
		    });

		    activity.onHidden(function() {
		        action = null;
		    });

		    activity.onHashChanged(function(pizza) {
		        document.querySelector('.pizza').textContent = pizza;
		    });
		});

	}]);
	
})(window.angular);