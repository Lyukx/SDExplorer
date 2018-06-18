#!/usr/bin/env zsh

npm run build
echo "Copying into docs file..."
cp -f ./dest/sd.js  ./docs/public/javascript/sd.js
echo "Copying into template repository..."
cp -f ./dest/sd.js  ../template-of-SDExplorer/public/javascripts/sd.js
