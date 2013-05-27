WebDrop
=======

WebDrop is a peer-to-peer file transfer application built upon Node.js, Socket.io and AngularJS.

It uses a slightly altered version of [DataChannel.js](https://github.com/muaz-khan/WebRTC-Experiment/tree/master/DataChannel) for circ[mventing Chrome's data channel bandwidth limitations.
 
Prerequisites
-------------

* Node.js

Installation
------------

Install node static for serving up the AngularJS app.

    npm install node-static

Install Socket.io for use as backend for room discovery.

    npm install socket.io

UglifyJS is used to bundle and minify the web app

    npm install -g uglify-js

Usage
-----

    node server.js

Then open a browser and direct it to `http://localhost:8080`.