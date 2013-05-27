angular.module('webdrop.controllers.file', [])
  .controller('fileCtrl', ['$scope', '$routeParams', function($scope, $routeParams) {

    var chunkSize = 800;

    $scope.fileRequest = {
      roomCode: $routeParams.roomCode,
      fileId: $routeParams.fileId,
      userId: $routeParams.userId,
      progress: {type: 'info', value: 0},
      metaData: {name: 'Unknown', size: -1, chunkCount: -1}
    };

    var chunkData = {
      receivedChunks: [],
      receivedChunkCount: 0
    }

    $scope.progress = {type: 'info', value: 0};

    $scope.status = "Waiting for user...";

    var channel = new DataChannel('room' + $scope.fileRequest.roomCode, {
      transmitRoomOnce: false,
      autoCloseEntireSession: false
    });

    channel.openSignalingChannel = function(config) {
      var URL = 'http://192.168.0.112:3000/';
      var channel = config.channel || this.channel || 'default-channel';
      console.log('openSignal channel ' + channel);
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

    /* ------ File sending ------- */

    var chunkTimeout = null;
    var chunkEndCallback = null;

    function askForChunkWrapper(chunkIndex) {
      //console.log('chunk timed out: ' + chunkIndex);
      return function() { askForChunk(chunkIndex) };
    }

    function askForChunk(chunkIndex) {
      if (chunkData.receivedChunkCount >= $scope.fileRequest.metaData.chunkCount) {
        chunkEndCallback();
        return;
      }
      console.log('Ask for chunk ' + chunkIndex);
      
      channel.channels[$scope.fileRequest.userId].send(webdropMessage('requestChunk', { chunkIndex: chunkIndex, fileId: $scope.fileRequest.fileId }))

      chunkTimeout = setTimeout(askForChunkWrapper(chunkIndex), 500); // after 500 ms, try again
    }

    function getFileWrapper(callback) {
      chunkEndCallback = callback;
      askForChunk(0);
    }
    
    /* ------ Messages ---------- */

    function requestFileFailed(userId) {
      $scope.status = "User " + userId + " does not offer the file you requested.";
    }

    function fileChunkReceived(userId, fileData) {
      if (chunkData.receivedChunks[fileData.index] === void 0) {
        clearTimeout(chunkTimeout);
        console.log('Chunk ' + fileData.index + ' received');
        chunkData.receivedChunks[fileData.index] = fileData.data;
        chunkData.receivedChunkCount++;

        fileProgress({
          remaining: $scope.fileRequest.metaData.chunkCount - chunkData.receivedChunkCount,
          received: chunkData.receivedChunkCount,
          length: $scope.fileRequest.metaData.chunkCount
        });

        askForChunk(fileData.index + 1);
      } else {
        console.log('Chunk ' + i + ' already received, IGNORING');
      }
    }

    function fileChunkReceivedFailed(userId) {
      $scope.fileRequest.progress.type = 'error';
      $scope.status = "File transfer from " + userId + " failed.";
    }

    function fileMetaDataReceived(userId, metaData) {
      $scope.fileRequest.metaData = metaData;

      getFileWrapper(function() {
        return fileReceived(metaData.name);
      });
    }

    var messageRouter = {
      fileRequestFailed: requestFileFailed,
      fileRequestMetaData: fileMetaDataReceived,
      fileRequestChunk: fileChunkReceived,
      fileRequestChunkFailed: fileChunkReceivedFailed
    };

    channel.onmessage = function(message, userId) {
      messageRouter[message.webdropType](userId, message.data);
      $scope.$apply();
    };

    channel.onopen = function(userId, rawChannel) { 
      if ($scope.fileRequest.userId == userId) {
        // Connected to user offering file
        console.log('Found user, sending file request');
        rawChannel.send(JSON.stringify(webdropMessage('requestMetaData', $scope.fileRequest.fileId)));
        console.log('Sent file request');
        $scope.status = "User found, requesting file...";
        $scope.$apply();
      } else {
        console.log('Found wrong user ' + userId);
      }
    };

    channel.onleave = function(userId) {
//      removeUser(userId);
      $scope.fileRequest.progress = { type: 'error', value: 100 };
      $scope.status = "User " + userId + " left before the transfer could be completed.";
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

    function fileReceived (fileName) {
      $scope.status = "File '" + fileName + "' received!";
      $scope.fileRequest.progress = { type: 'success', value: 100 };
      
      fileUrl = chunkData.receivedChunks.join('');
      var save = document.createElement('a');
      save.href = fileUrl;
      save.target = '_blank';
      save.download = fileName || fileUrl;

      var evt = document.createEvent('MouseEvents');
      evt.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);

      save.dispatchEvent(evt);

      (window.URL || window.webkitURL).revokeObjectURL(save.href);
      
      $scope.$apply();
    };

    function fileProgress (packets) {
      // packets.remaining
      // packets.sent      (for sender)
      // packets.received  (for receiver)
      // packets.length

      var now = new Date();

      if (typeof $scope.fileRequest.startTime == "undefined")
        $scope.fileRequest.startTime = now;

      var ellapsed = now - $scope.fileRequest.startTime;
      var transferSpeed = '--';

      if ($scope.fileRequest.metaData.size > 0) {
        var bytesPerMillisecond = (packets.received * chunkSize) / ellapsed; // 1000 is bytes per package
        var kiloBytesPerSecond = (bytesPerMillisecond / 1024) * 1000;
        var transferSpeed = kiloBytesPerSecond.toFixed(2);
      }

      $scope.status = "Downloading file... ( " + transferSpeed + " kB/s )";
      var progress = parseInt((packets.received / packets.length) * 100, 10);
      $scope.fileRequest.progress.value = progress;
      $scope.$apply();
    };

  }]);