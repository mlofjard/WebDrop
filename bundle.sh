#!/bin/bash
CURRENT_DIR=`pwd`

# jump to scripts folder
cd $(dirname $0)/content/scripts

# bundle, minify and create source map
uglifyjs  controllers/*.js \
          directives/*.js \
          app.js \
          -o app.min.js \
          --source-map app.min.js.map \
          -c -m

# temp fix until chrome supports the new source map pragma //# (changed 2013-05-16)
sed -i 's/\/\/\#\ sourceMappingURL/\/\/\@\ sourceMappingURL/' app.min.js

# jump back
cd $CURRENT_DIR
