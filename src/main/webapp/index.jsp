<!DOCTYPE html>

<!-- define angular app -->
<html ng-app="app" >

<head>
  <!-- SCROLLS -->
  <link rel="stylesheet" href="/css/font-awesome.css" />
  <link rel="stylesheet" href="/css/bootstrap.css" />
  <link rel="stylesheet" href="/js/lib/wysiwyg/wig.css" />
 
  <!-- SPELLS -->
  <script src="js/lib/underscore.js"></script>
  <script src="js/app/utils.js"></script>
  
<!--   <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script> -->

  <script type="text/javascript">
  	var files = { "js/lib/angular" : ["angular.js", "ui-router.js", "animate.js", "ui-bootstrap.js",
  	                                 ],
  	              "js/lib/wysiwyg" : ["wig.js", "plugins/formats.ngWig.js"],
				  "js/app/modules" : ["routerStyle.js", { "article": [ "article-service.js"] }]  	
  				}
  	
  	includeScript(files)
  	
  </script>
  
  <script src="js/app/main.js"></script>
</head>

<!-- define angular controller -->
<body ng-controller="mainController" ui-router-styles>

  <nav class="navbar navbar-default">
    <div class="container">
      <div class="navbar-header">
        <a class="navbar-brand" href="/">Going to be Awessomee Blog</a>
      </div>

      <ul class="nav navbar-nav navbar-right">
        <li><a href="#learn"><i class="fa fa-home"></i> Home</a></li>
        <li><a href="#about"><i class="fa fa-shield"></i> About</a></li>
        <li><a href="#contact"><i class="fa fa-comment"></i> Contact</a></li>
      </ul>
    </div>
  </nav>

  <div class="container">
        <!-- views will be injected here -->
        <div ui-view></div>
  </div>
  
  <footer class="text-center">
    <p>View the tutorial on <a href="http://scotch.io/tutorials/javascript/single-page-apps-with-angularjs-routing-and-templating">Scotch.io</a></p>
  
    <p>View a tutorial on <a href="http://scotch.io/tutorials/javascript/animating-angularjs-apps-ngview">Animating Your Angular Single Page App</a></p>
  </footer>
  
</body>

</html>
