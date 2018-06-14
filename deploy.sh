#!/usr/bin/env zsh

npm run build
cp -f ./dest/sd.js  ../template-of-SDExplorer/public/javascripts/sd.js
