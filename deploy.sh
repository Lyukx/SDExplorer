#!/usr/bin/env zsh

npm run build
echo "Copying into docs file..."
cp -f ./dest/sd.js  ./docs/public/javascript/sd.js
echo "Copying into docgen repository..."
cp -f ./dest/sd.js  ../docgen2018/docs/resource/js/sd.js
