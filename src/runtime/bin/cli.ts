#!/usr/bin/env node
try{
    require('@ecmal/runtime');
    System.import(process.argv[2])
        .then(m=>{
            if(typeof m.main == 'function'){
                m.main(process.argv.slice(2));
            }
        })
        .catch(e=>console.error(e));
}catch(e){
    console.error(e);
}