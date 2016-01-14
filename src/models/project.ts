import FileSystem from "../utils/fs";
import {Repository} from "../utils/git";
import {Compiler} from "../compiler";

const crypto = require('crypto');
const FILE:symbol = Symbol('file');
const CONFIG:symbol = Symbol('config');
const COMPILER:symbol = Symbol('compiler');
const SOURCES:symbol = Symbol('sources');
const DEPS:symbol = Symbol('dependencies');
const REPO_SOURCE:symbol = Symbol('repo.source');
const REPO_RELEASE:symbol = Symbol('repo.release');
const EXTS = {
    '.d.ts'     : 'definition',
    '.ts'       : 'source',
    '.js.map'   : 'map',
    '.js'       : 'script'
};

type Sources = {[k:string]:Source};
type Config = {[k:string]:any};
type Deps = {[k:string]:Project};

export class Source {
    static isResource(ext):boolean{
        return ['.ts','.d.ts','.js','.js.map'].indexOf(ext)<0;
    }
    static getHash(content){
        return crypto.createHash('md5').update(content).digest("hex");
    }
    static getName(path){
        var exts = Object.keys(EXTS);
        for(var e of exts){
            var i = path.lastIndexOf(e);
            if(i>0 && i==path.length-e.length){
                return path.substring(0,i)
            }
        }
        if(path.lastIndexOf('.')>0){
            return path.substring(0,path.lastIndexOf('.'));
        }else{
            return path;
        }

    }
    static getExt(path){
        var exts = Object.keys(EXTS);
        for(var e of exts){
            var i = path.lastIndexOf(e);
            if(i==path.length-e.length){
                return e;
            }
        }
        if(path.lastIndexOf('.')>0){
            return path.substring(path.lastIndexOf('.'));
        }
    }
    static getType(path){
        var exts = Object.keys(EXTS);
        for(var e of exts){
            var i = path.lastIndexOf(e);
            if(i==path.length-e.length){
                return EXTS[e];
            }
        }
        return 'resource'
    }
    public name:string;
    public project:string;
    public files:any;
    public main:boolean;
    get uri(){
        return this.project+'/'+this.name;
    }
    get ts(){
        return this.files['.ts'];
    }
    get js(){
        return this.files['.js'];
    }
    get tsx(){
        return this.files['.tsx']
    }
    get tsd(){
        return this.files['.d.ts']
    }
    get map(){
        return this.files['.js.map'];
    }
    get version(){
        var file = (this.ts || this.tsx || this.tsd);
        if(file && file.content){
            return String(file.hash);
        }
    }
    get content(){
        var file = (this.ts || this.tsx || this.tsd);
        if(file && file.content){
            return file.content.toString();
        }
    }
    get script(){
        return this.files['.js'];
    }

    get resources(){
        return Object.keys(this.files).filter(k=>Source.isResource(k)).map(k=>this.files[k])
    }
    get compilable(){
        return !!(this.files['.ts'] || this.files['.tsx'])
    }
    constructor(project:string,name:string,main=true){
        this.main = main;
        this.project = project;
        this.name = name;
        this.files = {};
    }
    mapTo(dir){
        var map = JSON.parse(this.map.content.toString());
        delete map.sourceRoot;
        map.sources = map.sources.map(s=>{
            return s.replace(this.project,'.')+(this.ts||this.tsx).ext;
        });
        map.sourcesContent = map.sources.map((s:string)=>{
            return FileSystem.readFile(FileSystem.resolve(dir,s)).toString();
        });
        map.sources = map.sources.map(s=>{
            return s.split('/').pop();
        });
        this.files['.js.map'].content = JSON.stringify(map);
    }
    addFile(file){
        var old = this.files[file.ext];
        if(!old){
            old = this.files[file.ext] = {};
        }
        for(var i in file){
            old[i] = file[i];
        }
        old.size = old.content.length;
        old.hash = Source.getHash(old.content);
    }

    toString(full:boolean=false){
        var fStr = '';
        if(full){
            for(var f in this.files){
                var file = this.files[f];
                fStr+=`\n  ${[
                    file.ext,
                    file.hash,
                    file.content.length
                ].join('\t')}`;
            }
        }
        return `Source('${this.uri}',${this.main?'Y':'N'},[${full?fStr+'\n':Object.keys(this.files).join(' ')}])`
    }
    toMetadata(){
        var meta = {
            name    : this.name,
            version : this.version,
            size    : this.js.size,
            hash    : this.js.hash,
            files   : {}
        };
        Object.keys(this.files).map(r=>(meta.files[r]={
            ext     : this.files[r].ext,
            hash    : this.files[r].hash,
            size    : this.files[r].size,
            sha     : this.files[r].sha
        }));
        return meta;
    }
    protected inspect(){
        return this.toString();
    }
}
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
            if(c.init()){
                c.addRemote('origin',this.dirname);
                c.exec('fetch','origin');
                c.exec('checkout','-b','release','origin/release');
                c.clear()
            }
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
        this.release.status();
        this.readGit();
        this.compileSources();
        this.writeSources();
        var status = this.release.status();
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
                this.release.exec('add',...added);
            }
            if(deleted.length){
                this.release.exec('rm',...deleted);
            }
            console.info(this.release.exec('commit','-am','Publishing Changes').output);
            if(this.release.status().clear){
                console.info(this.release.exec('push').output);
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
    protected inspect(){
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
        FileSystem.readDir(this.vendorDir,false,true).forEach(dir=>{
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
        });
        this[DEPS] = deps;
    }

    private compileSources(){
        for(var s:Source of this.sourcesAll){
            this.compiler.addSource(s);
        }
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
            var path = FileSystem.resolve(this.vendorDir,this.name,s.name+file.ext);
            FileSystem.writeFile(path,file.content);
        }
        for(var file of s.resources){
            var path = FileSystem.resolve(this.vendorDir,this.name,s.name+file.ext);
            FileSystem.writeFile(path,file.content);
        }
    }
}