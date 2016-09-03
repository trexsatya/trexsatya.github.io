<!DOCTYPE html>
<html ng-app="myApp">
    <head>
        <meta charset="utf-8" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="viewport" content="user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1, width=device-width, height=device-height" />

        <link rel="stylesheet" href="js/lib/phonon/css/phonon.css" />
        <title>App</title>
    </head>
    <body>
        
        <!-- Panel tags go here -->

        <!-- Side Panel tags go here -->

        <!-- Notification tags go here -->

        <!-- Dialog tags go here -->


        <!-- the home page is the default one. -->
       <!--  <home data-page="true" ng-include src="'html/home.html'" ng-controller="HomeCtrl" data-ng-ready></home> -->

        <!-- Second page. --> 
        <pagetwo data-page="true" id="pagetwo" ng-include src="'html/pagetwo.html'" ng-controller="PageTwoCtrl"></pagetwo>
        
          <div class="side-panel side-panel-left" data-expose-aside="none" data-disable="right" data-page="home" id="side-panel-example">
            <header class="header-bar">
                <button class="btn pull-right icon icon-close show-for-phone-only" data-side-panel-close="true"></button>
                <div class="pull-left">
                    <h1 class="title">Side Panel</h1>
                </div>
            </header>
            <div class="content">
                <ul class="list">
                    <li><a class="padded-list">Profile</a></li>
                    <li><a class="padded-list">About</a></li>
                    <li><a class="padded-list">Settings</a></li>
                    <li><a class="padded-list">Login</a></li>
                </ul>
            </div>
        </div>

        <home data-page="true">
            <header class="header-bar">
                <button class="btn icon icon-menu pull-left show-for-phone-only" data-side-panel-id="side-panel-example"></button>
                <div class="center">
                    <h1 class="title">Side Panels</h1>
                </div>
            </header>
            <div class="content">
                <div class="padded-full">
                    <div class="show-for-tablet-up">
                        <h3>On tablet/large screens</h3>

                        <p>In this demo, the attribute data-expose-aside has the value "left" so the side panel is visible and cannot be closed. On the other hand, if you set the value "none", it is possible to drag and drop in order to toggle the side panel.</p>
                    </div>

                    <div class="show-for-phone-only">
                        <h3>On phone screens</h3>

                        <p>In this demo, drag and drop in the page content to open or close the side panel.</p>
                        <p>You can also click the menu button.</p>
                    </div>
                </div>
            </div> 
        </home>

        <!-- scripts -->
        <script src="js/lib/angular.min.js"></script>
        <script src="js/lib/phonon/phonon.js"></script>

        <script src="js/app.js"></script>
        <script>
            phonon.options({
                navigator: {
                    defaultPage: 'home',
                    animatePages: true
                },
                i18n: null
            });
            phonon.navigator().start();
        </script>
    </body>
</html>