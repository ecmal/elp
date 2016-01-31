import FileSystem from "../utils/fs";
import {Repository} from "../utils/git";
import {Remotes} from "../utils/git";
import {Status} from "../utils/git";
import {Compiler} from "../compiler/compiler";
//import {Watcher} from "../compiler/watcher";
import {Source} from "./source";
import {Registry} from "./registry";
import {Url} from "./url";
import {Library} from "./library";


const crypto = require('crypto');
const FILE:symbol = Symbol('file');
const CONFIG:symbol = Symbol('config');
const COMPILER:symbol = Symbol('compiler');
//const WATCHER:symbol = Symbol('watcher');
const SOURCES:symbol = Symbol('sources');
const DEPS:symbol = Symbol('dependencies');
const REPO_SOURCE:symbol = Symbol('repo.source');
const REPO_RELEASE:symbol = Symbol('repo.release');

const BUNDLE = `(function(main,scripts){
    var evaluate;
    if(typeof window!='undefined'){
        evaluate = function evaluate(name,content){
            var aMain = document.querySelector('script[main]');
            aMain.removeAttribute('main');
            aMain = aMain.src.split('/');
            aMain.pop();
            aMain =  aMain.join('/');
            var aHead = document.querySelector('head');
            var aScript = document.createElement('script');
            aScript.type = 'text/javascript';
            aScript.id = name;
            aScript.setAttribute('main',true);

            aScript.text = content+'\\n//# sourceURL='+aMain+'/'+name+'.js'
            aHead.appendChild(aScript);
            aScript.setAttribute('src',aMain+'/'+name+'.js');
        }
    }else{
        evaluate = function evaluate(name,content){
            var context = {
                Buffer      : Buffer,
                require     : require,
                process     : process,
                console     : console,
                global      : global,
                __filename  : __filename,
                __dirname   : __dirname
            };
            require('vm').runInNewContext(content,context,{
                filename : __dirname+'/'+name+'.js'
            });
        }
    }
    var runtimeName = 'runtime/package';
    var runtimeScript = scripts[runtimeName];
    delete scripts[runtimeName];
    evaluate(runtimeName,runtimeScript);
    System.bundle(scripts);
    System.import(main).catch(function(e){
        console.info(e.stack||e);
    });
})`;


export type Sources = {[k:string]:Source};
export type Deps = {[k:string]:Project};


export class Project {

    static read(path:string):Project{
        let pack;
        path = FileSystem.resolve(path);
        if(!FileSystem.exists(path)){
            console.error(`Invalid project path "${path}"`);
        }
        if(FileSystem.isDir(path)){
            path = FileSystem.resolve(path,'package.json');
        }
        pack = new Project(path);
        if(FileSystem.isFile(path)){
            pack.patch(FileSystem.readJson(path));
        }
        return pack;
    }

    private [FILE]:string;
    private [CONFIG]:any;
    private [SOURCES]:Sources;
    private [REPO_SOURCE]:Repository;
    private [REPO_RELEASE]:Repository;
    private [DEPS]:Deps;

    get filename():string{
        return this[FILE];
    }
    get dirname():string{
        return FileSystem.dirname(this.filename);
    }
    get config():any{
        var c=this[CONFIG];
        if(!c){
            c=this[CONFIG]={};
        }
        return c;
    }
    get sources():Sources{
        var c=this[SOURCES];
        if(!c){
            c=this[SOURCES]={};
        }
        return c;
    }
    get sourcesAll():Source[]{
        var sources:Source[] = this.sourcesSelf;
        for(let d in this.deps){
            let library = this.deps[d];
            for(let s in library.sources){
                sources.push(library.sources[s])
            }
        }
        return sources;
    }
    get sourcesSelf():Source[]{
        var sources:Source[] = [];
        for(let s in this.sources){
            sources.push(this.sources[s])
        }
        return sources;
    }

    get git():Repository{
        var c=this[REPO_SOURCE];
        if(!c && Repository.isGitDir(this.dirname)){
            c = this[REPO_SOURCE] = new Repository(this.dirname);
        }
        return c;
    }
    get release():Repository{
        var c:Repository=this[REPO_RELEASE];
        if(!c && this.git){
            c = this[REPO_RELEASE] = new Repository(this.outputDir);
            var refs = this.git.refs();
            if(!Repository.isGitDir(this.outputDir)){
                this.git.exec('worktree','prune');
                if(refs.heads.release){
                    this.git.exec('worktree','add',this.outputDir,'release');
                }else{
                    var tempName = 'temp-'+Math.round(Math.random()*1000);
                    this.git.exec('worktree','add','-b',tempName,this.outputDir);
                    console.info(c.exec('checkout','--orphan','release').output);
                    this.git.exec('branch','-d',tempName);
                }
                var refs = c.refs();
                console.info(refs);
            }
        }else{
            console.info("NOT RELEASE",this.dirname,Repository.isGitDir(this.dirname))
        }
        return c;
    }
    get compiler():Compiler{
        var c=this[COMPILER];
        if(!c){
            c = this[COMPILER] = new Compiler(this);
        }
        return c;
    }
    get remotes():Remotes{
        return this.git.remotes();
    }
    get status():Status{
        return this.git.status();
    }
    get deps():Deps{
        return this[DEPS];
    }
    get format():string{
        return this.config.format;
    }
    get target():string{
        return this.config.target;
    }
    get bundle():string{
        if(this.config.bundle){
            return `package.js`;
        }
    }
    get core():string{
        return this.config.core || 'core';
    }
    get name():string{
        return this.config.name;
    }
    get vendor():string{
        return this.config.vendor;
    }
    get version():string{
        return this.config.version;
    }
    get registry():string{
        return this.config.registry;
    }
    set name(v:string){
        this.config.name=v;
    }
    get dirs(){
        if(!this.config.directories){
            this.config.directories = {}
        }
        return this.config.directories;
    }
    get main():string{
        return `${this.name}/${this.config.main||'index'}`;
    }

    constructor(path){
        this[FILE] = path;
    }

    get sourceDir():string {
        var srcDir = this.dirs.source;
        if(!srcDir){
            if(FileSystem.isDir(FileSystem.resolve(this.dirname,'./src'))){
                srcDir = './src'
            }else
            if(FileSystem.isDir(FileSystem.resolve(this.dirname,'./source'))){
                srcDir = './source'
            }else
            if(FileSystem.isDir(FileSystem.resolve(this.dirname,'./sources'))){
                srcDir = './sources'
            }
            this.dirs.source = srcDir;
        }
        if(srcDir){
            return FileSystem.resolve(this.dirname,srcDir);
        }else{
            throw new Error('source directory not specified');
        }
    }
    get testsDir():string {
        var testDir = this.dirs.tests;
        if(!testDir){
            if(FileSystem.isDir(FileSystem.resolve(this.dirname,'./test'))){
                testDir = './test'
            }else
            if(FileSystem.isDir(FileSystem.resolve(this.dirname,'./tests'))){
                testDir = './tests'
            }
            this.dirs.tests = testDir;
        }
        if(testDir){
            return FileSystem.resolve(this.dirname,testDir);
        }
    }
    set sourceDir(v:string){
        this.dirs.source = FileSystem.relative(this.dirname,v);
    }
    get vendorDir():string {
        var venDir = this.dirs.vendor;
        if(!venDir){
            venDir = this.dirs.vendor = './out';
        }
        return FileSystem.resolve(this.dirname,venDir);
    }
    get outputDir():string{
        return FileSystem.resolve(this.vendorDir,this.name);
    }

    public patch(props:any){
        for(var key in props){
            this.config[key] = props[key];
        }
        return this;
    }
    public watch(tests:boolean=false){
        tests = tests && !!this.testsDir;
        this.clean();
        this.readFs(tests);
        this.watchSources(tests);
        this.writeSources();
        this.writePackage();
    }
    public compile(tests:boolean=false,bundle:boolean=false,exec:boolean=false){
        tests = tests && !!this.testsDir;
        if(bundle){
            this.readFs();
            this.compileSources();
            this.bundleSources(exec);
        }else{
            this.clean();
            this.readFs(tests);
            this.compileSources();
            this.writeSources();
            this.writePackage();
        }
    }
    public install(){
        Object.keys(this.config.libraries).forEach(k=>{
            var key = Url.parse(k);
            var url = Url.parse(this.config.libraries[k]);
            if(!url.project){
                url.project = key.project;
            }
            if(!url.vendor){
                url.vendor = key.vendor || this.vendor;
            }
            if(!url.registry){
                url.registry = key.registry || this.registry;
            }
            var library = Library.get(url);
            if(!library.installed){
                library.install();
            }else{
                library.fetch();
            }
            library.extract(this.vendorDir)
        })
    }
    public publish(force?:boolean){
        this.clean();
        var stats  = this.git.status();
        var refs = this.git.refs();
        var num  = stats.local.commit.substring(0,6);
        var com  = this.git.log(stats.local.commit,-1)[0];
        var rem  = stats.remote.name;
        var ver  = this.version;

        var rel = `refs/releases/${ver}/${num}`;
        //var name = 'T'+parseInt(Math.random()*1000);
        //this.git.exec('worktree','prune');
        //this.git.exec('worktree','add',this.outputDir,'-b',name);
        var rels = refs.releases;
        var tags = refs.tags;
        if(force){
            console.info(this.git.exec('update-ref','-d',rel));
            console.info(this.git.push(rem,`:${rel}`));
        }else
        if(rels && rels[ver] && rels[ver][num]){
            throw new Error(`Already published '${ver}/${num}'`);
        }
        if(tags && tags[ver]){
            console.info(this.git.exec('tag','-d',ver));
            console.info(this.git.push(rem,`:refs/tags/${ver}`));
        }
        var release = new Repository(this.outputDir);
        release.init();
        release.addRemote('origin',this.git.path);
        release.head(rel);

        //this.git.exec('branch','-d',name);
        this.readGit();
        this.compileSources();
        this.writeSources();
        this.writePackage();
        var status = release.status();
        var changes = status.changes;
        var added = [], deleted = [];
        if(!status.clear){
            console.info(status);
            for(var c in changes){
                var change = changes[c];
                if(change.untracked){
                    added.push(change.path);
                }
                if(change.deleted){
                    deleted.push(change.path);
                }
            }
            if(added.length){
                release.exec('add',...added);
            }
            if(deleted.length){
                release.exec('rm',...deleted);
            }
            console.info(release.exec('commit','-am',com.subject));
            status = release.status();

            if(status.clear){
               console.info(status);
               console.info(release.push('origin',rel));
               console.info(this.git.tag(ver,rel));
               console.info(this.git.push(rem,rel,true));
            }
        }else{
            console.info('No Changes');
        }

    }
    public clean(){
        FileSystem.removeDir(this.outputDir);
    }
    public toString(full=false):string{
        return `Project(${this.name}${full?','+JSON.stringify(this.config,null,2):''})`;
    }

    private inspect(){
        return this.toString(true)
    }
    private readFs(tests:boolean=false){
        this.readDependencies();
        this.readSourcesFromFs(tests);
        return Object.keys(this.sources);
    }
    private readGit(branch?){
        this.readDependencies();
        this.readSourcesFromGit(branch);
        return Object.keys(this.sources);
    }

    private readSourcesFromGit(branch='HEAD',main:boolean=true){
        if(this.git){
            var files = this.git.readDir(branch,this.dirs.source);
            for(var f in files){
                var file        = files[f];
                file.from       = 'git';
                file.name       = Source.getName(file.path);
                file.ext        = Source.getExt(file.path);
                if(file.ext){
                    file.content    = this.git.readFile(file.sha);
                    var source = this.sources[file.name];
                    if(!source){
                        source = this.sources[file.name] = new Source(this.name,file.name,main);
                    }
                    source.addFile(file);
                }
            }
        }
    }
    private readSourcesFromFs(tests:boolean=false,main:boolean=false){
        FileSystem.readDir(this.sourceDir,true).forEach(f=>{
            var file:any = {
                path : FileSystem.relative(this.sourceDir,f)
            };
            if(file.path!='package.json'){
                file.from = 'file';
                file.name = Source.getName(file.path);
                file.ext = Source.getExt(file.path);
                if(file.ext){
                    file.content = FileSystem.readFile(f);
                    var source = this.sources[file.name];
                    if(!source){
                        source = this.sources[file.name] = new Source(this.name,file.name,main);
                    }
                    source.addFile(file);
                }
            }
        });
        if(tests){
            FileSystem.readDir(this.testsDir,true).forEach(f=>{
                var file:any = {
                    path : FileSystem.relative(this.testsDir,f)
                };
                if(file.path!='package.json'){
                    file.from = 'file';
                    file.name = Source.getName(file.path);
                    file.ext = Source.getExt(file.path);
                    if(file.ext){
                        file.content = FileSystem.readFile(f);
                        var source = this.sources[file.name];
                        if(!source){
                            source = this.sources[file.name] = new Source(this.name,file.name,main);
                            source.dirname = FileSystem.dirname(f)
                        }
                        source.addFile(file);
                    }
                }
            });
        }
    }
    private readDependencies(){
        var deps = {};
        if(FileSystem.isDir(this.vendorDir)){
            FileSystem.readDir(this.vendorDir,false,true).forEach(dir=>{
                if(FileSystem.isDir(dir) && FileSystem.isFile(FileSystem.resolve(dir,'package.json'))){
                    var project = Project.read(dir);
                    if(project.name != this.name){
                        project.patch({
                            directories : {
                                source  : '.',
                                vendor  : '..'
                            }
                        });
                        project.readSourcesFromFs(false,false);
                        deps[project.name] = project;
                    }
                }
            });
        }
        this[DEPS] = deps;
    }
    private compileSources(){
        var diagnostics = this.compiler.compile();
        if(diagnostics.length){
            console.info('FAILED');
        }else{
            console.info('COMPILED');
        }
    }

    private writeSources(){
        this.sourcesSelf.forEach(s=>{
            this.writeSource(s);
        });
    }
    private watchSources(tests:boolean=false){
        var diagnostics = this.compiler.compile();
        if(diagnostics.length){
            console.info('FAILED');
        }else{
            console.info('COMPILED');
        }
        var listener = (t,e,f)=>{
            try{
                var from = t?'test':'main';
                var path = FileSystem.resolve(t?this.testsDir:this.sourceDir,f);
                var file:any = {path:f};
                if(FileSystem.exists(path)){
                    file.from = 'file';
                    file.name = Source.getName(file.path);
                    file.ext = Source.getExt(file.path);
                    if(file.ext){
                        file.content = FileSystem.readFile(path).toString();
                        var source = this.sources[file.name];
                        if(!source){
                            source = this.sources[file.name] = new Source(this.name,file.name,true);
                            source.dirname = FileSystem.dirname(path)
                        }
                        source.addFile(file);
                        var diagnostics = this.compiler.compile();
                        if(diagnostics.length){
                            console.info(`FAILED   ${from} : ${file.path}`);
                        }else{
                            console.info(`COMPILED ${from} : ${file.path}`);
                        }
                        if(this.bundle){
                            this.writeSource(this.sources['package']);
                        }else{
                            this.writeSource(source);
                        }
                    }
                }else{
                    console.info(`DELETED  :${from} : ${file.path}`);
                }
            }catch(ex){
                console.info(ex.stack);
            }
        };
        console.info('WATCHING');
        console.info(' * '+this.sourceDir);
        FileSystem.watchDir(this.sourceDir,(e,f)=>listener(false,e,f),true);
        if(tests){
            console.info(' * '+this.testsDir);
            FileSystem.watchDir(this.testsDir,(e,f)=>listener(true,e,f),true);
        }
    }

    private bundleSources(exec?:boolean,filename?:string){
        var sources={};
        this.sourcesAll.forEach(s=>{
            sources[s.uri] = s.bundle(true);
        });
        var content = `${BUNDLE}('${this.main}',${JSON.stringify(sources,null,2)});`;
        var file = filename||FileSystem.resolve(this.dirname,'bundle.js');
        FileSystem.writeFile(file,(exec?'#!/usr/bin/env node\n':'')+content);
    }
    private writePackage(){
        var json = this.compilePackage();
        var packFile = FileSystem.resolve(this.vendorDir,this.name,'package.json');
        var packContent = JSON.stringify(json,null,'  ');
        FileSystem.writeFile(packFile,packContent);
    }
    private compilePackage():any{
        var json:any = {
            name        : this.name,
            vendor      : this.vendor,
            version     : this.version,
            registry    : this.registry,
            format      : this.format,
            bundle      : !!this.bundle,
            libraries   : this.config.libraries
        };
        if(this.git){
            var status = this.git.status();
            var config = this.git.config();
            json.author = config.user;
            json.commit = status.remote.commit;
            var repoUrl = config.remote[status.remote.name].url;
            json.repository = repoUrl;
            json.registry = Registry.for(repoUrl).id;
        }
        json.modules = {};
        this.sourcesSelf.forEach(s=>{
            json.modules[s.name] = s.toMetadata();
        });
        return json;
    }
    private writeSource(s:Source){
        for(var t of ['tsd','js','map']){
            let file = s[t];
            if(file){
                var path = FileSystem.resolve(this.vendorDir,this.name,s.name+file.ext);
                FileSystem.writeFile(path,file.content);
            }
        }
        for(var file of s.resources){
            var path = FileSystem.resolve(this.vendorDir,this.name,s.name+file.ext);
            FileSystem.writeFile(path,file.content);
        }
    }

}