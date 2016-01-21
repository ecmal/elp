import FileSystem from "../utils/fs";
import {Repository} from "../utils/git";
import {Compiler} from "../compiler/compiler";
import {Source} from "./source"; import {stat} from "node/fs";


const crypto = require('crypto');
const FILE:symbol = Symbol('file');
const CONFIG:symbol = Symbol('config');
const COMPILER:symbol = Symbol('compiler');
const SOURCES:symbol = Symbol('sources');
const DEPS:symbol = Symbol('dependencies');
const REPO_SOURCE:symbol = Symbol('repo.source');
const REPO_RELEASE:symbol = Symbol('repo.release');


type Sources = {[k:string]:Source};
type Config = {[k:string]:any};
type Deps = {[k:string]:Project};


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
    private [CONFIG]:Config;
    private [SOURCES]:Sources;
    private [REPO_SOURCE]:Repository;
    private [RELEASE]:Repository;
    private [DEPS]:Deps;

    get filename():string{
        return this[FILE];
    }
    get dirname():string{
        return FileSystem.dirname(this.filename);
    }
    get config():Config{
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
                    var tempName = 'temp-'+parseInt(Math.random()*1000);
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
    get remotes(){
        return this.git.remotes();
    }
    get status(){
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
    get name():string{
        return this.config.name;
    }
    set name(v:string){
        this.config.name=v;
    }
    get dirs(){
        if(!this.config.directories){
            this.config.directories = {
                source  : './src',
                vendor  : './lib',
                tests   : './test'
            }
        }
        return this.config.directories;
    }

    constructor(path){
        this[FILE] = path;
    }

    get sourceDir():string {
        return FileSystem.resolve(this.dirname,this.dirs.source);
    }
    set sourceDir(v:string){
        this.dirs.source = FileSystem.relative(this.dirname,v);
    }
    get vendorDir():string {
        return FileSystem.resolve(this.dirname,this.dirs.vendor);
    }
    set vendorDir(v:string){
        this.directories.vendor = FileSystem.relative(this.dirname,v);
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
    public compile(){
        this.clean();
        this.readFs();
        this.compileSources();
        this.writeSources();
    }
    public publish(){
        this.clean();

        var stats  = this.git.status();
        var local  = stats.local;
        var remote = (()=>{
            var path = stats.remote.split('/');
            return {
                name    : path[0],
                branch  : path[1],
            }
        })();

        var name = 'T'+parseInt(Math.random()*1000);
        this.git.exec('worktree','prune');
        this.git.exec('worktree','add',this.outputDir,'-b',name);

        var release = new Repository(this.outputDir);
        release.clear();
        release.head(`refs/release/${local}`);

        this.git.exec('branch','-d',name);
        this.readGit();
        this.compileSources();
        this.writeSources();
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
            console.info(release.exec('commit','-am','Publishing Changes').output);
            status = release.status();
            if(status.clear){
                console.info(this.release.exec('push','-u',remote.name,`refs/release/${local}:refs/release/${remote.branch}`).output);
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
    private readFs(){
        this.readDependencies();
        this.readSourcesFromFs();
        return Object.keys(this.sources);
    }
    private readGit(branch?){
        this.readDependencies();
        this.readSourcesFromGit(branch);
        return Object.keys(this.sources);
    }
    private readSources(branch?,main?){
        if(main){
            this.readSourcesFromGit(branch,main);
        }else{
            this.readSourcesFromFs(main);
        }
        //this.readSourcesFromFs(branch,main);
    }
    private readSourcesFromGit(branch='HEAD',main?:boolean=true){
        if(this.git){
            var files = this.git.readDir(branch,this.dirs.source);
            for(var f in files){
                var file        = files[f];
                file.from       = 'git';
                file.name       = Source.getName(file.path);
                file.ext        = Source.getExt(file.path);
                file.content    = this.git.readFile(file.sha);
                var source = this.sources[file.name];
                if(!source){
                    source = this.sources[file.name] = new Source(this.name,file.name,main);
                }
                source.addFile(file);
            }
        }
    }
    private readSourcesFromFs(main?){
        FileSystem.readDir(this.sourceDir,true).forEach(f=>{
            var file = {
                path : FileSystem.relative(this.sourceDir,f)
            };
            if(file.path!='package.json'){
                file.from = 'file';
                file.name = Source.getName(file.path);
                file.ext = Source.getExt(file.path);
                file.content = FileSystem.readFile(f);
                var source = this.sources[file.name];
                if(!source){
                    source = this.sources[file.name] = new Source(this.name,file.name,main);
                }
                source.addFile(file);
            }
        })
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
                        project.readSourcesFromFs(false);
                        deps[project.name] = project;
                    }
                }
            });
        }
        this[DEPS] = deps;
    }

    private compileSources(){
        /*for(var s:Source of this.sourcesAll){
            this.compiler.addSource(s);
        }*/
        this.compiler.compile();
    }
    private writeSources(){
        //this.prepareReleaseDir();
        var json = JSON.parse(JSON.stringify(this.config));
        json.modules = {};
        this.sourcesSelf.forEach(s=>{
            this.writeSource(s);
            json.modules[s.name] = s.toMetadata();
        });
        var packFile = FileSystem.resolve(this.vendorDir,this.name,'package.json');
        var packContent = JSON.stringify(json,null,'  ');
        FileSystem.writeFile(packFile,packContent);
    }
    private writeSource(s:Source){
        s.mapTo(this.sourceDir);
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