WebDrop
=======

WebDrop is a peer-to-peer file transfer application built upon Node.js, Socket.io and AngularJS.

It uses a slightly altered version of (DataChannel.js)[https://github.com/muaz-khan/WebRTC-Experiment/tree/master/DataChannel] for circumventing Chrome's data channel bandwidth limitations.
 
Prerequisites
-------------

* Node.js

Installation
------------

    npm install node-static

    npm install socket.io

UglifyJS is used to bundle and minify the web app
    npm install -g uglify-js

Usage
-----

    node server.js

Then open a browser and direct it to `http://localhost:8080`.