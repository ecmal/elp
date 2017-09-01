import system from "@ecmal/runtime";

const packs=(list)=>`
${JSON.stringify(list)}.find(function(p){
    try {
        let m = System.require(p);
        if(typeof m.main == 'function'){
            let args = []; 
            if(typeof process!='undefined'){
                args = process.argv.slice(2);
            }
            m.main(args);
            return true;
        }
    }catch(e){
        console.error(e);
    }
});
`;

function replaceSourceMap(source:string,id){
    return source.replace(/^\/\/#\s*sourceMappingURL=(.*)$/mg,'//'+id)
}
export async function main(args:string[]){
    const PT = require('path');
    const FS = require('fs');

    let self = args.shift();
    let bundle = PT.resolve(args.pop());

    let runtime = system.read('@ecmal/runtime');
    console.info(bundle);
    args.forEach(pack=>system.read(pack));

    let modules = system.modules
        .filter(m=>(m.id != self && m != runtime))
        .map(m=>replaceSourceMap(m.source,m.id));

    modules.unshift(replaceSourceMap(runtime.source,runtime.id));
    modules.push(packs(args));
    FS.writeFileSync(bundle,modules.join('\n'));

}