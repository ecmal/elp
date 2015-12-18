#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd $DIR;

rm -rf $DIR/../node_modules
rm -rf $DIR/../out
rm -rf $DIR/../lib

npm install typescript@1.7.3
npm install git+https://bitbucket.org/ecmal/runtime.git
npm install git+https://bitbucket.org/ecmal/http.git
npm install git+https://bitbucket.org/ecmal/github.git

node $DIR/install.js
node $DIR/build.js

rm -rf $DIR/../node_modules
