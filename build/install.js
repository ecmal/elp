var fs = require("fs");
var path = require("path");
var utils = require("./utils");
var buildDir = path.resolve(__dirname,'../build');
var modDir = path.resolve(__dirname,'../node_modules');
var outDir = path.resolve(__dirname,'../out');
var libDir = path.resolve(__dirname,'../lib');
var modNames = fs.readdirSync(modDir);
var modules = [];

modNames.forEach(function(m){
    if(m!='.bin') {
        var modRoot = path.resolve(modDir, m);
        var modLib = path.resolve(outDir, m);
        var modSrc  = path.resolve(modRoot,'lib');
        if(!fs.existsSync(modSrc)){
            modSrc = path.resolve(modRoot,'src');
        }
        modules = modules.concat(fs.readDirRecursive(modSrc).map(function (f) {
            var p,mod = {
                lib  : m,
                name : m + '/' + path.relative(modSrc, f),
                file : f
            };

            if(mod.file.match(/^.*\.js$/gi)){
                p =path.resolve(outDir,mod.name);
                fs.makeDirRecursive(path.dirname(p));
                console.info(f,'to',p);
                fs.renameSync(f,p);
            } else
            if(mod.file.match(/^.*\.d\.ts$/gi)){
                p = path.resolve(outDir,mod.name);
                fs.makeDirRecursive(path.dirname(p));
                console.info(f,'to',p);
                fs.renameSync(f,p);
            } else
            if(mod.file.match(/^.*\.ts$/gi)){
                mod.src = fs.readFileSync(f);
            }
            return mod;
        }));
        fs.makeDirRecursive(modLib);
        fs.renameSync(
            path.resolve(modRoot,'package.json'),
            path.resolve(modLib,'package.json')
        );
    }
});

var compiler = require('./compiler');

modules.forEach(function(m){
    if(m.src){
        console.info('compile',m.file);
        var result = compiler.transpile(m.src.toString(), {
            fileName: m.file,
            moduleName: m.name.replace(/^(.*)(\.ts)$/,'$1'),
            compilerOptions: {
                declaration: true,
                module: compiler.ModuleKind.System,
                experimentalDecorators: true,
                inlineSourceMap:true,
                inlineSources:true
            }
        });
        var libFile = path.resolve(outDir,m.name).replace(/^(.*)(\.ts)$/,'$1.d.ts');
        var outFile = path.resolve(outDir,m.name).replace(/^(.*)(\.ts)$/,'$1.js');
        fs.makeDirRecursive(path.dirname(libFile));
        fs.makeDirRecursive(path.dirname(outFile));
        fs.writeFileSync(libFile,result.tsd,'utf8');
        fs.writeFileSync(outFile,result.out,'utf8');
    }
});


