AngularJS:

Data Binding:
(Badly, Dynamically scoped)

<input type="text" ng-model="obj.prop" />   //Outer scope

<div ng-if="true">                          //Inner scope
    <input type="text" ng-model="obj.prop" />
</div>

ng-if is a directive: It creates a new scope, which is available to the program as an object.
this scope is inner to the scope for first input.

Dependency Injection: (Badly, Parameter name based)

MyController.$inject = ['$scope', '$window']; or 
module.controller('MyController', ['$scope', '$window', MyController]);

$scope.data = "Something" does not update value
$scope.apply( function(){  $scope.data = "Something" })

$digest: Data synching cycles in AngularJS are called digest, 
$scope.$digest() reevalutates all watchers in scope,

Error: $digest already in progress
Solution: $timeout, $timeout calls new digest lifecycle after delay, so no error
Better : $evalAsync does not create a new digest lifecycle if one is already going on , instead adds callback to queue.		 

$apply calls $rootScope.$digest() => invokes watchers of available in scope => execute complete lifecycle

if code is queued using $evalAsync from a directive, it should run after the DOM has been manipulated by Angular, but before the browser renders
if code is queued using $evalAsync from a controller, it should run before the DOM has been manipulated by Angular (and before the browser renders) -- rarely do you want this
if code is queued using $timeout, it should run after the DOM has been manipulated by Angular, and after the browser renders (which may cause flicker in some cases)




