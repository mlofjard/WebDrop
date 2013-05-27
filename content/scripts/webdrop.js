$(document).ready(function() {

  var connectButton = $('#connect');
  var people = $('#people');
  var messages = $('#messages');
  var messageInput = $('#message');
  var sendButton = $('#send');
  var nickInput = $('#nick');
  var privateMessageInput = $('#privatemessage');
  var privateMessageToInput = $('#messageto');
  var privateSendButton = $('#sendprivate');
  var fileInput = $('#file');
  var fileToInput = $('#fileto');
  var fileSendButton = $('#sendfile');
  
  var connectedPeople = {};
  var channel = new DataChannel('default-channel', {
    transmitRoomOnce: false
  });

  function addUser(userNick) {
    if (typeof(connectedPeople[userNick]) == "undefined") {
      var li = $(document.createElement('li'));
      li.attr('id', 'nick_' + userNick);
      li.text(userNick);
      people.append(li);

      connectedPeople[userNick] = {};
    }
  }

  function removeUser(userNick) {
    var li = $('li#nick_' + userNick);
    li.remove();
    delete(connectedPeople[userNick]);
  }

  function addMessage(from, msg) {
    var li = $(document.createElement('li'));
    li.text(from + ': ' + msg);
    messages.append(li);
  }

  connectButton.on('click', function(e) {
    connectButton.prop('disabled', true);
    var nick = nickInput.val();
    channel.userid = nick;
    nickInput.prop('disabled', true);

    var socket = io.connect('http://192.168.0.112:3000/chat');
    socket.on('connect', function () {
      socket.emit('userConnected', nick);
      socket.emit('whoIsHere');

      sendButton.prop('disabled', false);
      privateSendButton.prop('disabled', false);
      fileSendButton.prop('disabled', false);

      sendButton.on('click', function(e) {
        console.log('send click');
        
        var li = $(document.createElement('li'));
        li.text('[me]' + ': ' + messageInput.val());
        messages.append(li);

        socket.emit('message', { from: nick, msg: messageInput.val() });
      });

      privateSendButton.on('click', function(e) {
        var data = {
          to: privateMessageToInput.val(),
          from: nick,
          msg: privateMessageInput.val()
        };
        socket.emit('privateMessage', data);
      });

      socket.on('message', function (data) {
        addMessage(data.from, data.msg)
      });

      socket.on('privateMessage', function (data) {
        addMessage('[P] ' + data.from, data.msg);
      });

      socket.on('whoIsHere', function (data) {
        for (var i = 0; i < data.length; i++) {
          addUser(data[i]);
        }
      });

      socket.on('userConnected', addUser);

      socket.on('userDisconnected', function (userNick) {
        removeUser(userNick);
      });

    });
  });

  channel.openSignalingChannel = function(config) {
     var URL = 'http://192.168.0.112:3000/';
     var channel = config.channel || this.channel || 'default-channel';
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

  channel.onmessage = function(message, userid) { 
    var li = $(document.createElement('li'));
    li.text('[RTC] ' + userid + ': ' + message);
    messages.append(li);        
  };

  channel.onopen = function(userid) { 
    addUser(userid);
  };

  channel.onleave = function(userid) {
    removeUser(userid);
  };

  channel.onclose = function(event) {
    console.log('ERROR: Data ports closed');
    console.log(event);
  }

  channel.onerror = function(event) {
    console.log('ERROR: Unknown error occured');
    console.log(event);
  }

  channel.onFileReceived = function (fileName) {
    var li = $(document.createElement('li'));
    li.text('[RTC File] OMG! I received a file.');
    messages.append(li);
  };

  var fileToSend = null;

  fileInput.on('change', function(e) {
    fileToSend = this.files[0];
  })

  fileSendButton.on('click', function(e) {
    var to = fileToInput.val();

    channel.channels[to].send(fileToSend);
  });

});