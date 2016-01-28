import {Project} from "../models/project";
import {Source} from "../models/source";
import TS from "compiler/typescript";
import FileSystem from "../utils/fs";

export class Compiler implements TS.CompilerHost {

    fileExists(fileName:string):boolean {
        console.info('CompilerHost.fileExists')
        return false;
    }
    readFile(fileName:string):string {
        console.info('CompilerHost.readFile')
        return null;
    }
    getSourceFile(fileName: string, target: TS.ScriptTarget, onError?: (message: string) => void): TS.SourceFile {
        var uri = Source.getName(fileName);
        var source = this.sources[uri];
        if(source){
            return TS.createSourceFile(fileName,source.content,target);
        }
    }
    getDefaultLibFileName(options: TS.CompilerOptions): string {
        return `${this.project.core}/index.d.ts`;
    }
    writeFile(fileName: string, data: string, writeByteOrderMark: boolean, onError?: (message: string) => void): void{
        if(fileName.indexOf(this.project.name+'/')==0){
            fileName = fileName.replace(this.project.name+'/','');
        }
        var name = Source.getName(fileName);
        var ext = Source.getExt(fileName);
        var source = this.project.sources[name];
        if(!source){
            source = this.project.sources[name] = new Source(this.project.name,name,true);
        }

        if(ext=='.js.map'){
            var map = JSON.parse(data);
            delete map.sourceRoot;
            map.sources = map.sources.map(n=>{
                if(n.indexOf(this.project.name+'/')==0){
                    return n.replace(this.project.name+'/','./');
                }else{
                    return './'+n;
                }
            });
            data = JSON.stringify(map,null,2);
        }


        source.addFile({
            name    : name,
            ext     : ext,
            content : new Buffer(data)
        });
    }
    getCurrentDirectory(): string{
        return '.';
    }
    getCanonicalFileName(fileName: string): string{
        return fileName;
    }
    useCaseSensitiveFileNames(): boolean{
        return true;
    }
    getNewLine(): string {
        return '\n';
    }
    resolveModuleName(dirName,modName){
        modName = modName.replace(/(\.d)?\.(ts|js)$/,'');
        modName = FileSystem.resolve('/'+dirName,modName).substr(1);
        return modName;
    }
    resolveModuleNames(moduleNames: string[], containingFile: string){
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
            return {
                resolvedFileName,isExternalLibraryImport
            };
        });
    }


    private project:Project;
    private program:TS.Program;
    private sources:{[k:string]:Source};

    constructor(project){
        this.project = project;
        this.program = null;
        this.sources = {};
    }

    compile(){
        this.sources = {};
        this.project.sourcesAll.forEach(s=>{
            this.sources[s.uri] = s;
        });
        var program = TS.createProgram(this.project.sourcesSelf.filter(s=>s.ts|| s.tsx).map(s=>s.uri),{
            module              : TS.ModuleKind[this.project.format||'System'],
            target              : TS.ScriptTarget[this.project.target||'ES5'],
            declaration         : true,
            sourceMap           : true,
            inlineSources       : true,
            noLib               : this.project.core != 'core',
            out                 : this.project.bundle
        },this);
        var result = program.emit();
        if(result.diagnostics && result.diagnostics.length){
            result.diagnostics.forEach((d:TS.Diagnostic)=>{
                console.info(d.code, d.category, d.file? d.file.fileName:'', d.messageText);
            })
        }
    }
}


