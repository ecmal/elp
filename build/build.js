#!/usr/bin/env node
var compiler = require('./compiler');
var fs = require('fs');
var path = require('path');
var utils = require('./utils');
var outDir = path.resolve(__dirname,'../out');
var libDir = path.resolve(__dirname,'../lib');
var srcDir = path.resolve(__dirname,'../src');

function compileSources(){
    var srcFiles = fs.readDirRecursive(srcDir);
    srcFiles.forEach(function (f) {
        compileSource('change',path.relative(srcDir,f));
    });
}
function compileSource(event,filename) {
    if(path.basename(filename)[0]!='.') {
        var srcFile = path.resolve(srcDir, filename);
        if (srcFile.match(/^(.*)(\.ts)$/)) {
            var outFile = path.resolve(outDir, 'espm', filename).replace(/^(.*)(\.ts)$/, '$1.js');
            var libFile = path.resolve(outDir, 'espm', filename).replace(/^(.*)(\.ts)$/, '$1.d.ts');
            if (fs.existsSync(srcFile)) {
                console.info('CHANGE', filename);
                var source = fs.readFileSync(srcFile);
                var result = compiler.transpile(source.toString(), {
                    fileName: filename,
                    moduleName: filename.replace(/^(.*)(\.ts)$/, '$1'),
                    compilerOptions: {
                        declaration: true,
                        module: compiler.ModuleKind.System,
                        experimentalDecorators: true,
                        inlineSourceMap: true,
                        inlineSources: true
                    }
                });
                if (result.out && result.out.trim()) {
                    console.info('  ', outFile);
                    fs.makeDirRecursive(path.dirname(outFile));
                    fs.writeFileSync(outFile, result.out, 'utf8');
                }
                if (result.tsd && result.tsd.trim()) {
                    console.info('  ', libFile);
                    fs.makeDirRecursive(path.dirname(libFile));
                    fs.writeFileSync(libFile, result.tsd, 'utf8');
                }
            } else {
                console.info('DELETE', filename);
                if (fs.existsSync(outFile)) {
                    console.info('  ', outFile);
                    fs.unlinkSync(outFile);
                }
                if (fs.existsSync(libFile)) {
                    console.info('  ', outFile);
                    fs.unlinkSync(libFile);
                }
            }
        } else {
            var outFile = path.resolve(outDir, 'espm', filename);
            if (fs.existsSync(srcFile)) {
                console.info('CHANGE', filename);
                console.info('  ', outFile);
                fs.makeDirRecursive(path.dirname(outFile));
                fs.copyFile(srcFile, outFile);
            } else {
                console.info('DELETE', filename);
                if (fs.existsSync(outFile)) {
                    console.info('  ', outFile);
                    fs.unlinkSync(outFile);
                }
            }
        }
    }else{
        console.info('IGNORE', filename);
    }
}
function watchSources(){
    if(process.argv.indexOf('-w')>=0 || process.argv.indexOf('--watch')>=0){
        var watcher = fs.watch(srcDir,{ persistent: true, recursive: true }, compileSource);
    }
}

compileSources();
watchSources();