import {Url} from "./url";
import {Registry} from "./registry";
import {Repository} from "../utils/git";
import FileSystem from "../utils/fs";
import config from "../config";

const URL:symbol = Symbol('url');
const GIT:symbol = Symbol('git');
const REGISTRY:symbol = Symbol('registry');

export class Library {

    static get home():string{
        return FileSystem.resolve(config.home,'registry');
    }

    static local(url:Url){
        return FileSystem.resolve(this.home,url.vendor,url.project+'.git');
    }
    static clear(){
        FileSystem.removeDir(this.home);
    }
    static list(){
        var libs = [];
        if(FileSystem.isDir(this.home)){
            FileSystem.readDir(this.home,false,true).forEach(v=>{
                var vendor = FileSystem.relative(this.home,v);
                FileSystem.readDir(v,false,true).forEach(p=>{
                    var project = FileSystem.basename(p,'.git');
                    libs.push(new Url(`${vendor}/${project}`));
                })
            });
        }
        return libs;
    }
    static get(url){
        return new Library(url);
    }
    static show(url){
        var u = Url.parse(url);
        var registry = Registry.get(u);
        var remote = registry.remote(u);
        var refs = Repository.refs(remote);
        var release = 'release';
        var source  = (()=>{
            for(var branch of Object.keys(refs.heads)){
                if(refs.heads[branch] == refs.head){
                    return branch;
                }
            }
            return refs.heads[0];
        })();
        if(refs.tags) {
            var versions = Object.keys(refs.tags).map(v=> {
                return {
                    version: v,
                    sha: refs.tags[v]
                }
            });
        }
        var local = Library.local(u);
        return {
            name       : u.project,
            vendor     : u.vendor,
            remote     : remote,
            local      : local,
            exist      : FileSystem.isDir(local),
            registry   : registry.id,
            source     : {
                name   : source,
                sha    : refs.heads[source]
            },
            release    : {
                name   : release,
                sha    : refs.heads[release]
            },
            versions   : versions,
            refs:refs
        }
    }
    static install(url){
        Library.get(Url.parse(url)).install();
    }
    constructor(url){
        this[URL] = Url.parse(url);
    }
    get url():Url{
        return this[URL];
    }
    get registry():Registry{
        var v = this[REGISTRY];
        if(!v){
            v = this[REGISTRY] = Registry.get(this.url);
        }
        return v;
    }
    get local(){
        return Library.local(this.url);
    }
    get remote(){
        return this.registry.remote(this.url);
    }
    get installed(){
        return FileSystem.isDir(Library.local(this.url));
    }
    get versions(){
        var refs = this.git.refs();
        var versions = {};
        Object.keys(refs.tags).forEach(t=>{
            versions[t] = refs.tags[t];
        });
        Object.keys(refs.releases).forEach(v=>{
            var release = refs.releases[v];
            Object.keys(release).forEach(c=>{
                if(versions[v]!=release[c]){
                    versions[v+'-'+c] = release[c];
                }
            });
        });
        return versions;
    }
    get git():Repository {
        var v:Repository = this[GIT];
        if(!v){
            v = this[GIT] = new Repository(this.local);
        }
        return v;
    }
    toString(){
        return `Library(${this.url.url})`
    }
    inspect(){
        return this.toString();
    }
    info(){

    }
    install(dev?:boolean){
        if(!this.git.initialized){
            this.git.init();
        }
        var remotes = this.git.remotes();
        if(!remotes[this.registry.id]){
            this.git.exec('config','--local',`remote.${this.registry.id}.url`,this.registry.remote(this.url));
            this.git.exec('config','--local','--add',`remote.${this.registry.id}.fetch`, `+refs/tags/*:refs/tags/*`);
            this.git.exec('config','--local','--add',`remote.${this.registry.id}.fetch`, `+refs/releases/*:refs/releases/*`);
            if(dev) {
                this.git.exec('config', '--local', '--add', `remote.${this.registry.id}.fetch`, `+refs/heads/*:refs/remotes/${this.registry.id}/*`);
            }
        }
        /*this.git.setConfig({
            [`remote.${this.registry.id}.url`]:this.registry.remote(this.url),
            [`remote.${this.registry.id}.fetch`]:[
                `+refs/tags/*:refs/tags/*`,
                `+refs/release/*:refs/release/*`
            ]
        });*/

        console.info(JSON.stringify(this.git.config(),null,2));
        console.info(this.git.fetch(this.registry.id));
    }
    fetch(){
        this.git.exec('fetch',this.registry.id);
    }
    extract(dir:string){
        var versions = this.versions;
        if(versions[this.url.version]){
            var map = this.git.readDir(versions[this.url.version]);
            var files = Object.keys(map).map(f=>{
                var file = FileSystem.resolve(dir,this.url.project,map[f].path);
                var content = this.git.readFile(map[f].sha);
                FileSystem.writeFile(file,content);
            });
        }
    }
    workdir(path,branch?,remote?){
        var result;
        this.git.exec('worktree','prune');
        if(branch){
            result = this.git.exec('worktree','add','-B',branch,path,remote).output
        }else{
            result = this.git.exec('worktree','add',path).output
        }
        console.info(result);
    }
    remove(){
        FileSystem.removeDir(this.git.path);
    }
    files(version){
        return this.git.readDir(version);
    }
    cached(){
        console.info(this.url.registry,this.url.vendor,this.url.project);
    }
}