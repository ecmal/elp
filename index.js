#!/usr/bin/env node
try{
    require('./out/runtime/package');
    system.import('elp/cli')
        .catch(function(m){
            console.error(m.stack);
        });
}catch(e){
    console.info("in production mode use 'elp' instead of 'elpd'");
    console.info(e.stack||e);
}

