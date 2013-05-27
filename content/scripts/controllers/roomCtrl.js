angular.module('webdrop.controllers.room', [])
  .controller('roomCtrl', ['$scope', '$routeParams', function($scope, $routeParams) {

    $scope.offeredFiles = {};

    $scope.roomCode = $routeParams.roomCode;
    $scope.currentUserId = '';

    $scope.messages = [];
    $scope.connectedUsers = {};

    $scope.sendMessage = function() {
      if ($scope.messageToSend && $scope.messageToSend != '') {
        // push to own feed
        $scope.messages.push({from: channel.userid, text: $scope.messageToSend});
        
        // send message to other participants
        channel.send(webdropMessage('message', $scope.messageToSend ));

        // clear message input
        $scope.messageToSend = "";
      }
    };

    function removeUser(userId) {
      delete $scope.connectedUsers[userId];
    }

    function addUser(userId) {
      console.log('adding user ' + userId);
      $scope.connectedUsers[userId] = {nickName: 'unknown'};
    }

    var channel = new DataChannel('room' + $scope.roomCode, {
      transmitRoomOnce: false,
      autoCloseEntireSession: false
    });

    channel.openSignalingChannel = function(config) {
      var URL = 'http://192.168.0.112:3000/';
      var channel = config.channel || this.channel || 'default-channel';
      console.log('openSignal channel ' + channel);
      $scope.currentUserId = channel.userid;
      $scope.$apply();
      var sender = Math.round(Math.random() * 60535) + 5000;

      io.connect(URL + 'rtc').emit('newChannel', {
        channel: channel,
        sender : sender
      });

      var socket = io.connect(URL + channel);
      socket.channel = channel;

      socket.on('connect', function () {
        if (config.callback) config.callback(socket);
      });

      socket.send = function (message) {
        socket.emit('message', {
          sender: sender,
          data  : message
        });
      };

      socket.on('message', config.onmessage);
    };

    function webdropMessage(messageType, messageData) {
      return { webdropType: messageType, data: messageData };
    }

    function pushToMessages(userId, message) {
      var nick = $scope.connectedUsers[userId].nickName; 
      $scope.messages.push({ from: nick, text: message });
    }

    function requestMetaData(userId, fileId) {
      if (typeof $scope.offeredFiles[fileId] != "undefined") {
        var file = $scope.offeredFiles[fileId];
        channel.channels[userId].send(webdropMessage('fileRequestMetaData', { name: file.name, size: file.size, chunkCount: file.chunks.length }));
      } else {
        console.log('File requested: File not found');
        channel.channels[userId].send(webdropMessage('fileRequestFailed'));
      }
    }

    function requestChunk(userId, fileDescriptor) {
      if (typeof $scope.offeredFiles[fileDescriptor.fileId] != "undefined") {
        var data = $scope.offeredFiles[fileDescriptor.fileId].chunks[fileDescriptor.chunkIndex];
        channel.channels[userId].send(webdropMessage('fileRequestChunk', { index: fileDescriptor.chunkIndex, data: data }));
      } else {
        channel.channels[userId].send(webdropMessage('fileRequestChunkFailed'));
      }
    }

    var messageRouter = {
      message: pushToMessages,
      requestMetaData: requestMetaData,
      requestChunk: requestChunk
    };

    channel.onmessage = function(message, userId) {
      messageRouter[message.webdropType](userId, message.data);
      $scope.$apply();
    };

    channel.onopen = function(userId) { 
      addUser(userId);
      $scope.$apply();
    };

    channel.onleave = function(userId) {
      removeUser(userId);
      $scope.$apply();
    };

    channel.onclose = function(event) {
      // TODO: try "reconnect"
      console.log('ERROR: Data ports closed');
      console.log(event);
    };

    channel.onerror = function(event) {
      console.log('ERROR: Unknown error occured');
      console.log(event);
    };
  }]);