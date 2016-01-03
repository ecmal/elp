import {FileSystem} from "../utils/fs";
import {Package} from "../models/package";
import {settings} from "node/cluster";

const ts = require('typescript');
const crypto = require('crypto');
const ScriptSnapshot:any = ts.ScriptSnapshot;
const NewLineKind:any = ts.NewLineKind;

export class Script {

    public uri:string;
    public version:string;
    public snapshot:any;

    constructor(uri,content?){
        this.uri = uri;
        if(content) {
            this.update(content);
        }
    }
    update(content){
        this.version = crypto.createHash('md5').update(content).digest("hex");
        this.snapshot = ScriptSnapshot.fromString(content);
    }
}
export class Compiler {
    getNewLine(){
       return '\n'
    }
    getScriptFileNames() {
        return Object.keys(this.scripts);
    }
    getSourceFileNames() {
        return this.getScriptFileNames().filter(f=>{
            return f.indexOf(this.projectName)==0;
        })
    }
    getScript(fileName):Script{
        if(!this.scripts[fileName]){
            this.scripts[fileName]=new Script(fileName)
        }
        return this.scripts[fileName];
    }
    getScriptVersion(fileName) {
        return this.getScript(fileName).version;
    }
    getScriptSnapshot(fileName) {
        return this.getScript(fileName).snapshot;
    }
    getCurrentDirectory() {
        return this.sourceDir;
    }
    getCompilationSettings(){
        if(this.release){
            return {
                target      : ts.ScriptTarget.ES5,
                declaration : true,
                module      : ts.ModuleKind.System,
                experimentalDecorators: true,
                inlineSourceMap:true,
                inlineSources:true
            };
        }else{
            return {
                target      : ts.ScriptTarget.ES5,
                declaration : true,
                module      : ts.ModuleKind.System,
                experimentalDecorators: true,
                sourceRoot:this.sourceDir,
                sourceMap:true
            };
        }
    }
    getDefaultLibFileName(options) {
        return 'runtime/index.d.ts';
    }
    resolveModuleName(dirName,modName){
        modName = modName.replace(/(\.d)?\.(ts|js)$/,'');
        modName = FileSystem.resolve('/'+dirName,modName).substr(1);
        if(this.scripts[modName+'.ts']){
            return modName+'.ts';
        }else{
            return modName+'.d.ts';
        }
        return modName;
    }
    resolveModuleNames(moduleNames: string[], containingFile: string){
        var containingDir:string = FileSystem.dirname(containingFile);
        return moduleNames.map(moduleName=>{
            var isRelative = moduleName[0]=='.';
            var isExternalLibraryImport = containingDir.indexOf(this.projectName)!=0;
            var resolvedFileName;
            if(isRelative){
                resolvedFileName = this.resolveModuleName(containingDir,moduleName);
            }else{
                resolvedFileName = this.resolveModuleName('',moduleName);
            }
            //console.info(isExternalLibraryImport?'EXTERNAL':'INTERNAL',containingDir,moduleName,' > ',resolvedFileName);
            return {
                resolvedFileName,
                isExternalLibraryImport
            };
        });
    }


    public get sourceDir():string{
        return this.settings.sourceDir;
    };
    public get outputDir():string{
        return this.settings.outputDir;
    };

    public get projectName():string{
        return this.settings.name;
    };
    public get projectVersion():string{
        return this.settings.version;
    };

    private release:boolean;
    private settings:Package;
    private service:any;
    private scripts:any;
    private watcher:any;

    constructor(){
        this.service = ts.createLanguageService(this);
        this.scripts = {};
    }

    private initRuntime(){
        var runtimeLibDir = FileSystem.resolve(this.outputDir,'runtime');
        if(!FileSystem.exists(runtimeLibDir)){
            var runtimeDir = FileSystem.resolve(__dirname,'../../../out/runtime');
            var runtimeDef = [
                '// Core Api',
                FileSystem.readFile(FileSystem.resolve(runtimeDir,'core.d.ts')).toString(),
                '// Browser Api',
                FileSystem.readFile(FileSystem.resolve(runtimeDir,'browser.d.ts')).toString(),
                '// NodeJS Api',
                FileSystem.readFile(FileSystem.resolve(runtimeDir,'node.d.ts')).toString(),
                '// Runtime Api',
                FileSystem.readFile(FileSystem.resolve(runtimeDir,'index.d.ts')).toString()
            ].join('\n');
            var runtimeJs = FileSystem.readFile(FileSystem.resolve(runtimeDir,'index.js')).toString();
            var runtimeJson = FileSystem.readFile(FileSystem.resolve(runtimeDir,'package.json')).toString();
            FileSystem.createDir(runtimeLibDir,true);
            FileSystem.writeFile(FileSystem.resolve(runtimeLibDir,'index.d.ts'),runtimeDef);
            FileSystem.writeFile(FileSystem.resolve(runtimeLibDir,'index.js'),runtimeJs);
            FileSystem.writeFile(FileSystem.resolve(runtimeLibDir,'package.json'),runtimeJson);
            console.info('Runtime Created');
        }
    }
    private loadDefinitions(){
        FileSystem.readDir(this.outputDir, true).forEach(f=> {
            if (f.match(/\.d\.ts$/)) {
                this.getScript(FileSystem.relative(this.outputDir, f)).update(FileSystem.readFile(f).toString());
            }
        });
    }
    private loadSources(){
        FileSystem.readDir(this.sourceDir, true).forEach(f=> {
            if (f.match(/(\.d)?\.ts$/)) {
                this.getScript(`${this.projectName}/${FileSystem.relative(this.sourceDir,f)}`).update(FileSystem.readFile(f).toString());
            }
        });
    }
    watch(pack:Package){
        this.compile(pack);
        console.info('Watch : '+this.projectName);
        this.watcher = FileSystem.watchDir(this.sourceDir,(e,f)=>{
            f = FileSystem.resolve(this.sourceDir,f);
            if(FileSystem.exists(f)) {
                var uri = `${this.projectName}/${FileSystem.relative(this.sourceDir, f)}`;
                this.getScript(uri).update(FileSystem.readFile(f).toString());
                this.compileSource(uri);
            }
        });
    }
    compile(pack:Package,release:boolean=false){
        var settingsDir = FileSystem.resolve(pack.outputDir,pack.name);
        var settingsFile = FileSystem.resolve(settingsDir,'package.json');

        this.release = release;
        this.settings = pack;

        this.initRuntime();
        this.loadDefinitions();
        this.loadSources();

        console.info('Compile : '+this.projectName);

        FileSystem.removeDir(settingsDir);
        this.settings.write(settingsFile);
        this.getSourceFileNames().forEach(uri=>{
            this.compileSource(uri,true)
        });
        return settingsFile;
    }
    compileSource(uri,reload=true){
        console.info('  ',uri);
        if(reload && uri.indexOf(this.projectName+'/')==0){
            var filename = FileSystem.resolve(this.sourceDir,uri.replace(this.projectName+'/',''));
            if(FileSystem.exists(filename)){
                this.getScript(uri).update(FileSystem.readFile(filename).toString());
            }
        }
        var result = this.service.getEmitOutput(uri);
        if(!result.emitSkipped){
            this.logErrors(uri);
        }
        result.outputFiles.forEach(o=>{
            var file = FileSystem.resolve(this.outputDir,o.name);
            console.error('    to ',o.name);
            FileSystem.writeFile(file,o.text);
        })
    }

    logErrors(fileName: string) {
        let allDiagnostics = this.service.getCompilerOptionsDiagnostics()
            .concat(this.service.getSyntacticDiagnostics(fileName))
            .concat(this.service.getSemanticDiagnostics(fileName));

        allDiagnostics.forEach(diagnostic => {
            let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            if (diagnostic.file) {
                let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
                console.log(`  Error ${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
            }
            else {
                console.log(`  Error: ${message}`);
            }
        });
    }
}