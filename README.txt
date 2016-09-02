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

Share information between controllers:
Use factory/service
app.factory('UserInformation', function() {
  var user = {
    name: "Angular.js"
  };

  return user;
});

app.controller('MainCtrl', function($scope, UserInformation) {
  $scope.user = UserInformation;
});

app.controller('SecondCtrl', function($scope, UserInformation) {
  $scope.user = UserInformation;
});


Services

Syntax: module.service( 'serviceName', function ); 
Result: When declaring serviceName as an injectable argument you will be provided with an instance of the function. In other words new FunctionYouPassedToService().

Factories

Syntax: module.factory( 'factoryName', function ); 
Result: When declaring factoryName as an injectable argument you will be provided with the value that is returned by invoking the function reference passed to module.factory.

Providers

Syntax: module.provider( 'providerName', function ); 
Result: When declaring providerName as an injectable argument you will be provided with (new ProviderFunction()).$get(). The constructor function is instantiated before the $get method is called - ProviderFunction is the function reference passed to module.provider.

Providers have the advantage that they can be configured during the module configuration phase.



