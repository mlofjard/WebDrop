angular.module('webdrop.controllers.main', [])
  .controller('mainCtrl', ['$scope', '$location', function($scope, $location) {

    $scope.joinRoom = function() {
      $location.path('/room/' + $scope.roomToJoin)
    };

    $scope.newRoom = function() {

    }

  }]);