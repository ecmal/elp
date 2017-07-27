import { Files } from "./utils/fs";
import { ts } from "./utils/node";

declare const __dirname:string;

const libPath = Files.resolve(__dirname, '../lib');
const tscPath = Files.resolve(ts.path, '..');

console.info("ts.lib.path",tscPath);
console.info("ec.lib.path",libPath);

function rewriteLines(lines:string[]){
    return lines.map((l,i,a)=>{
        if(l.indexOf('function createLanguageServiceSourceFile')>0){
            l = l.replace('scriptKind','scriptKind, options')
        }
        if(l.indexOf('ts.createSourceFile(fileName, text, scriptTarget, setNodeParents, scriptKind')>0){
            l = l.replace('scriptKind','scriptKind, options')
        }
        if(l.indexOf('ts.createSourceFile(fileName, text, languageVersion, setParentNodes) : undefined;')>0){
            l = l.replace('setParentNodes','setParentNodes, void 0, options')
        }
        if(l.indexOf('ts.createLanguageServiceSourceFile(fileName, scriptSnapshot, compilationSettings.target, version, false, scriptKind')>0){
            l = l.replace('scriptKind', 'scriptKind, compilationSettings')
        }
        if(l.indexOf('function watchedDirectoryChanged')>0){
            a[i+2] = a[i+2].replace('return','return ts.onUnsupportedSourceFile(fileName, compilerOptions)');
        }
        if(l.indexOf('var USE_NEW_TYPE_METADATA_FORMAT')>0){
            l = l.replace('false','true');
        }
        return l;
    })
    
}
function compileTsc() {
    let oldPath = Files.resolve(tscPath, 'tsc.js');
    let newPath = Files.resolve(__dirname, '../lib/tsc.js')
    let source = Files.read(oldPath).trim();
    let patch = Files.read(Files.resolve(__dirname, './patch/tsc.ts'));
    let lines = source.split('\n');
    let execLine = lines.pop();
    lines = rewriteLines(lines);
    source = lines.join('\n');
    source = [
        source,
        ts.transpile(patch, {
            removeComments: true
        }),
        execLine
    ].join('\n');
    Files.write(newPath, source);
}
function compileTss() {
    function copy(path) {
        let oldPath = Files.resolve(tscPath, `${path}.js`);
        let newPath = Files.resolve(__dirname, `../lib/${path}.js`)
        Files.write(newPath, Files.read(oldPath));
    }
    copy('typingsInstaller');
    copy('watchGuard');
    copy('cancellationToken');
    
    let oldPath = Files.resolve(tscPath, 'tsserver.js');
    let newPath = Files.resolve(__dirname, '../lib/tsserver.js')
    let source = Files.read(oldPath).trim();
    let patch = Files.read(Files.resolve(__dirname, './patch/tsc.ts'));
    let lines = source.split('\n');
    let execLine = '';
    lines = rewriteLines(lines)
    source = lines.join('\n');
    /*let execLine = 'ts.executeIoServer();';
    source = lines.map(l => {
        let line = l.trim();
        if (line == 'ioSession.listen();') {
            return 'ts.ioSession = ioSession';
        } else {
            return l;
        }
    }).join('\n');*/
    source = ([
        source,
        ts.transpile(patch, {
            removeComments: true
        }),
        execLine
    ]).join('\n');
    Files.write(newPath, source);
}
function compileLib() {
    let files:Array<string> = [
        'lib.es5',
        'lib.es2015.core',
        'lib.es2015.collection',
        'lib.es2015.generator',
        'lib.es2015.iterable',
        'lib.es2015.promise',
        'lib.es2015.proxy',
        'lib.es2015.reflect',
        'lib.es2015.symbol',
        'lib.es2015.symbol.wellknown',
        'lib.es2016.array.include',
        'lib.es2017.intl',
        'lib.es2017.object',
        'lib.es2017.sharedmemory',
        'lib.es2017.string',
        'lib.esnext.asynciterable'
    ];
    files = files.map(
        (f, i, a) => Files.read(Files.resolve(tscPath, `${f}.d.ts`))
    );

    files.push(Files.read(Files.resolve(__dirname, './patch/lib.d.ts')));


    let source = files.join('\n')
    source = source.split('\n').filter(l => {
        return !l.trim().match(/^\/\/\/(.*)$/)
    }).join('\n')
    source = source.replace(/\r/gm, '').replace(/\n+/gm, '\n');
    source = `/// <reference no-default-lib="true"/>\n${source}`;

    let newPath = Files.resolve(__dirname, '../lib/lib.d.ts')
    //console.info(newPath);
    Files.write(newPath, source);
}
function compileTs(){
    let oldPath = Files.resolve(tscPath, 'typescript.js');
    let newPath = Files.resolve(__dirname, '../out/@ecmal/typescript/index.js')
    let source = Files.read(oldPath).trim();
    let patch = Files.read(Files.resolve(__dirname, './patch/tsc.ts'));
    let lines = source.split('\n');
    lines = rewriteLines(lines)
    source = lines.join('\n');
    source = [
        'System.register("@ecmal/typescript/index",[],function(exporter,module,require,exports,__filename,__dirname){',
        source,
        ts.transpile(patch, {
            removeComments: true
        }),
        '});'
    ].join('\n');
    Files.write(newPath, source);
}
function compileTsd(){
    let oldPath = Files.resolve(tscPath, 'typescript.d.ts');
    let newPath = Files.resolve(__dirname, '../out/@ecmal/typescript/index.d.ts')
    let source = Files.read(oldPath).trim();
    let lines = source.split('\n');
    source = lines.map(l=>{
        let line = l.trim();
        if(line=='export = ts;'){
            return null;
        }
        if(line=='declare namespace ts {'){
            return 'declare module "@ecmal/typescript/index" {'
        }else{
            return l;
        }
    }).join('\n');
    Files.write(newPath, source);
}

compileLib();
compileTsc();
compileTss();
compileTs();
compileTsd();