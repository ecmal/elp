#!/usr/bin/env node
require('./out/runtime/package');
System.import('elp/cli')
    .catch(function(m){
        console.error(m.stack);
    });