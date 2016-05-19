require('./out/runtime/package');
system.import("cyclic/cyclic").catch(function(ex){
    console.info(ex);
});