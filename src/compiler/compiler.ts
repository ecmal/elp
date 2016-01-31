import {Project} from "../models/project";
import {Source} from "../models/source";
import TS from "compiler/index";
import FileSystem from "../utils/fs";

export class Compiler implements TS.CompilerHost {
    fileExists(fileName:string):boolean {
        console.info('CompilerHost.fileExists');
        return false;
    }
    readFile(fileName:string):string {
        console.info('CompilerHost.readFile');
        return null;
    }
    getSourceFile(fileName: string, target: TS.ScriptTarget, onError?: (message: string) => void): TS.SourceFile {
        var uri = Source.getName(fileName);
        if(fileName=='package.d.ts'){
            var definitions = [],defs=[];
            Object.keys(this.sources).forEach(s=>{
                var source = this.sources[s];
                if(source.name =='package' && source.tsd && source.tsd.content){
                    defs.push(`${source.project}/${source.name}.d.ts`);
                    definitions.push(`//${source.project}/package.d.ts`);
                    definitions.push(source.tsd.content.toString());
                }
            });
            return TS.createSourceFile(fileName,definitions.join('\n'),target);
        }else{
            var source = this.sources[uri];
            if(source){
                return TS.createSourceFile(fileName,source.content,target);
            }
        }
    }
    getDefaultLibFileName(options: TS.CompilerOptions): string {
        return `package.d.ts`;
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
            try {
                var map = JSON.parse(data);
                delete map.sourceRoot;
                map.sources = map.sources.map(n=> {
                    if (n.indexOf(this.project.name + '/') == 0) {
                        return n.replace(this.project.name + '/', './');
                    } else {
                        return './' + n;
                    }
                });
                data = JSON.stringify(map, null, 2);
            }catch(e){
                console.info(e.stack);
                console.info(fileName,ext);
                console.info(data);
            }
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

        var src = this.sources[modName];
        if(src) {
            if (src.ts) {
                modName = modName + '.ts'
            } else if (src.tsx) {
                modName = modName + '.tsx'
            } else if (src.tsd) {
                modName = modName + '.d.ts'
            }
        }
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
                resolvedFileName,
                isExternalLibraryImport
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
    get options():TS.CompilerOptions{

        var modFormat:TS.ModuleKind  = TS.ModuleKind.System;
        if(this.project.format){
            switch(this.project.format.toUpperCase()){
                case 'AMD'      :modFormat=TS.ModuleKind.AMD;break;
                case 'COMMONJS' :modFormat=TS.ModuleKind.CommonJS;break;
                case 'ES6'      :modFormat=TS.ModuleKind.ES6;break;
                case 'ES2015'   :modFormat=TS.ModuleKind.ES2015;break;
                case 'NONE'     :modFormat=TS.ModuleKind.None;break;
                case 'SYSTEM'   :modFormat=TS.ModuleKind.System;break;
                case 'UMD'      :modFormat=TS.ModuleKind.UMD;break;
            }
        }
        var modTarget:TS.ScriptTarget  = TS.ScriptTarget.ES5;
        if(this.project.target){
            switch(this.project.target.toUpperCase()){
                case 'ES3'      :modTarget=TS.ScriptTarget.ES3;break;
                case 'ES5'      :modTarget=TS.ScriptTarget.ES5;break;
                case 'ES6'      :modTarget=TS.ScriptTarget.ES6;break;
                case 'ES2015'   :modTarget=TS.ScriptTarget.ES2015;break;
                case 'Latest'   :modTarget=TS.ScriptTarget.Latest;break;
            }
        }

        return <TS.CompilerOptions> {
            experimentalDecorators  : true,
            module                  : modFormat,
            target                  : modTarget,
            declaration             : true,
            sourceMap               : true,
            inlineSources           : true,
            noLib                   : this.project.core != 'core',
            out                     : this.project.bundle
        }
    }
    compile(){
        this.sources = {};
        this.project.sourcesAll.forEach(s=>{
            this.sources[s.uri] = s;
        });
        var sources = this.project.sourcesSelf.filter(s=>s.ts||s.tsx).map(s=>s.uri+'.ts');
        this.program = TS.createProgram(sources,this.options,this,this.program);
        var diagnostics:Array<TS.Diagnostic> = [];
        var result = this.program.emit();
        this.program.getSourceFiles().forEach(s=>{
            var d = [];
            d = d.concat(this.program.getSyntacticDiagnostics(s)||[]);
            d = d.concat(this.program.getDeclarationDiagnostics(s)||[]);
            d = d.concat(this.program.getSemanticDiagnostics(s)||[]);
            if(d.length) {
                diagnostics = diagnostics.concat(d)
            }
        });
        diagnostics = diagnostics.concat(this.program.getGlobalDiagnostics());
        diagnostics = diagnostics.concat(this.program.getOptionsDiagnostics());

        if(result.diagnostics && result.diagnostics.length){
            diagnostics = diagnostics.concat(result.diagnostics);
        }
        diagnostics = diagnostics.filter(d=>(d && d.code!=1166)).sort((a,b)=>{
            if(a.file && b.file){
                return a.file.fileName== b.file.fileName?0:(
                    a.file.fileName>b.file.fileName?1:-1
                )
            }else{
                return 0;
            }
        });
        if(diagnostics.length>0){
            let len:number = Math.min(10,diagnostics.length);
            for(let dk=0;dk<len;dk++){
                let d:TS.Diagnostic = diagnostics[dk];
                var category = '';
                switch(d.category){
                    case TS.DiagnosticCategory.Error   :category='Error';   break;
                    case TS.DiagnosticCategory.Warning :category='Warning'; break;
                    case TS.DiagnosticCategory.Message :category='Message'; break;
                }
                var file = ' - ';
                if(d.file){
                    let { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
                    file = ` '${d.file.fileName}:${line+1}:${character+1}' - `;
                }
                var message = TS.flattenDiagnosticMessageText(d.messageText, '\n  ');
                console.info(`  ${category} ${d.code}${file}${message}`);
            }
            if(diagnostics.length>len){
                console.info(`  ... ${diagnostics.length-len} more`);
            }
        }
        return diagnostics;
    }
}


