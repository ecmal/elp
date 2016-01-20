import {Project} from "./models/project";
import ts from "compiler/typescript";
import {Source} from "./models/source";
import {FileSystem} from "./utils/fs";
import * as crypto from "node/crypto";

export class Compiler {

    getNewLine(){
       return '\n'
    }
    getScriptFileNames(){
        return Object.keys(this.sources);
    }

    getScriptVersion(file) {
        var source:Source = this.sources[Source.getName(file)];
        if(source){
            return source.version
        }
    }
    getScriptSnapshot(file) {
        var source:Source = this.sources[Source.getName(file)];
        if(source){
            return ts.ScriptSnapshot.fromString(source.content)
        }
    }
    getCurrentDirectory() {
        return this.project.sourceDir;
    }
    getCompilationSettings(){
        return {
            target                  : ts.ScriptTarget.ES5,
            declaration             : true,
            module                  : ts.ModuleKind.System,
            experimentalDecorators  : true,
            sourceRoot              :'.',
            sourceMap               :true
        };
    }
    getDefaultLibFileName(options) {
        return 'runtime/index';
    }
    resolveModuleName(dirName,modName){
        modName = modName.replace(/(\.d)?\.(ts|js)$/,'');
        modName = FileSystem.resolve('/'+dirName,modName).substr(1);
        return modName;
    }
    resolveModuleNames(moduleNames: string[], containingFile: string){
        //console.info(containingFile,moduleNames);
        var containingDir:string = FileSystem.dirname(containingFile);
        return moduleNames.map(moduleName=>{
            var isRelative = moduleName[0]=='.';
            var isExternalLibraryImport = containingDir.indexOf(this.project.name)!=0;
            var resolvedFileName;
            if(isRelative){
                resolvedFileName = this.resolveModuleName(containingDir,moduleName);
            }else{
                resolvedFileName = this.resolveModuleName('',moduleName);
            }
            //console.info(isExternalLibraryImport?'EXTERNAL':'INTERNAL',containingDir,moduleName,' > ',resolvedFileName);
            return {
                resolvedFileName,isExternalLibraryImport
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

    private project:Project;
    private release:boolean;
    private settings:Package;
    private service:any;
    private scripts:any;
    private sources:any;
    private watcher:any;

    constructor(project){
        this.release = true;
        this.project = project;
        this.service = ts.createLanguageService(this);
        this.scripts = {};
        this.sources = {};
    }
    addSource(s:Source){
        this.sources[s.uri] = s;
    }
    compile(){
        for(let s in this.sources){
            var source = this.sources[s];
            if(source.main){
                this.compileSource(source);
            }
        }
    }
    compileSource(source){
        if(source && source.compilable){
            process.stdout.write("COMPILING "+source+"\r");
            var result = this.service.getEmitOutput(source.uri);
            if(!result.emitSkipped){
                result.outputFiles.forEach(o=>{
                    source.addFile({
                        ext     : Source.getExt(o.name),
                        content : new Buffer(o.text)
                    });
                });
            }
            process.stdout.write('\033[0G');
            process.stdout.write("COMPILED "+source+"\n");
            this.logErrors(source.uri);
        }
    }
    getDiagnostics(fileName: string):ts.Diagnostic[]{
        return this.service.getCompilerOptionsDiagnostics()
            .concat(this.service.getSyntacticDiagnostics(fileName))
            .concat(this.service.getSemanticDiagnostics(fileName));
    }
    logErrors(fileName: string) {

        let allDiagnostics = this.getDiagnostics(fileName);
        if(allDiagnostics.length){
            allDiagnostics.forEach((diagnostic:ts.Diagnostic) => {

                let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
                var fileInfo = '';
                if (diagnostic.file) {
                    let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
                    fileInfo = `${diagnostic.file.fileName} (${line + 1},${character + 1})`;
                }
                var type = 'Info';
                switch(diagnostic.category){
                    case 0:type = 'Warning';break;
                    case 1:type = 'Error';break;
                    case 2:type = 'Message';break;
                }

                console.log(`  ${type} ${diagnostic.code} at ${fileInfo}: ${message}`);

            });
        }

    }
}