var compiler = require('./compiler');
var fs = require('fs');
var path = require('path');
var utils = require('./utils');
var outDir = path.resolve(__dirname,'../out');
var libDir = path.resolve(__dirname,'../lib');
var srcDir = path.resolve(__dirname,'../src');

var srcFiles = fs.readDirRecursive(srcDir);

srcFiles.forEach(function(f){
    var p = 'espm/'+path.relative(srcDir,f);
    var source = fs.readFileSync(f);
    var result = compiler.transpile(source.toString(), {
        fileName: f,
        moduleName: p.replace(/^(.*)(\.ts)$/,'$1'),
        compilerOptions: {
            declaration: true,
            module: compiler.ModuleKind.System,
            experimentalDecorators: true,
            inlineSourceMap:true,
            inlineSources:true
        }
    });
    var libFile = path.resolve(libDir,p).replace(/^(.*)(\.ts)$/,'$1.d.ts');
    var outFile = path.resolve(outDir,p).replace(/^(.*)(\.ts)$/,'$1.js');
    fs.makeDirRecursive(path.dirname(libFile));
    fs.makeDirRecursive(path.dirname(outFile));
    fs.writeFileSync(libFile,result.tsd,'utf8');
    fs.writeFileSync(outFile,result.out,'utf8');
});
