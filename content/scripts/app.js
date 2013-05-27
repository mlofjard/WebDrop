(function () {

  angular.module('webdrop.controllers', ['webdrop.controllers.main', 'webdrop.controllers.room', 'webdrop.controllers.file']);

  angular.module('webdrop.directives', ['ui.bootstrap', 'webdrop.directives.fileoffer']);

  angular.module('webdrop', ['webdrop.controllers', 'webdrop.directives'], ['$routeProvider', function($routeProvider) {
    $routeProvider
      .when('/', {
        controller: 'mainCtrl',
        templateUrl: 'views/main.html'
      })
      .when('/room/:roomCode', {
        controller: 'roomCtrl',
        templateUrl: 'views/room.html'
      })
      .when('/file/:roomCode/:userId/:fileId', {
        controller: 'fileCtrl',
        templateUrl: 'views/file.html'
      })
      .otherwise({
        redirectTo: '/'
      });
  }]);

}());