#!/bin/bash
CURRENT_DIR=`pwd`
uglifyjs  scripts/controllers/*.js \
          scripts/directives/*.js \
          scripts/app.js \
          -o scripts/app.min.js \
          --source-map scripts/app.min.js.map \
           -c -m
#mv app.min.js content/scripts
