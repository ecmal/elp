#!/usr/bin/env node

require('./out/runtime');
System.import('espm/cli')
    .catch(function(m){
        console.error(m.stack);
    });