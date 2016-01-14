#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd $DIR;

#rm -rf $DIR/../node_modules
rm -rf $DIR/../out

git clone -b release --single-branch https://bitbucket.org/ecmal/runtime.git ../out/runtime
git clone -b release --single-branch https://bitbucket.org/ecmal/compiler.git ../out/compiler

#node $DIR/install.js
#node $DIR/build.js

#rm -rf $DIR/../node_modules
