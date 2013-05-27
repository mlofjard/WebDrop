
var nodeStatic = require('node-static');

var http = require('http');
var io = require('socket.io').listen(3000);
var staticServer = new(nodeStatic.Server)('./content/');

var connectedUsers = {};

function onNewNamespace(socket, channel, sender) {
  io.of('/' + channel).on('connection', function (socket) {
    if (io.isConnected) {
      io.isConnected = false;
      socket.emit('connect', true);
    }

    socket.on('message', function (data) {
      if (data.sender == sender) socket.broadcast.emit('message', data.data);
    });
  });
}

io.of('/rtc').on('connection', function(socket){
  if (!io.connected) io.connected = true;

  socket.on('newChannel', function (data) {
    onNewNamespace(socket, data.channel, data.sender);
  });
});

io.of('/chat').on('connection', function(socket){
  var myNick = '';

  socket.on('userConnected', function(nick){
    myNick = nick;
    connectedUsers[nick] = socket;
    console.log('user ' + nick + ' connected');
    socket.broadcast.emit('userConnected', nick);
  });

  socket.on('whoIsHere', function(){
    var data = [];
    for (var key in connectedUsers) {
      if (key != myNick)
        data.push(key);
    }
    socket.emit('whoIsHere', data);
  });
  
  socket.on('message', function(data){
    socket.broadcast.emit('message', data);
  });

  socket.on('privateMessage', function(data) {
    if (typeof(connectedUsers[data.to]) != "undefined") {
      connectedUsers[data.to].emit('privateMessage', data);
    }
  });

  socket.on('disconnect', function(){
    socket.broadcast.emit('userDisconnected', myNick);
    delete(connectedUsers[myNick]);
  });
});


console.log("App available at http://localhost:8080/");
http.createServer(function (request, response) {
    staticServer.serve(request, response);
}).listen(8080);