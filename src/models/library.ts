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
        var url = Url.parse(url);
        var registry = Registry.get(url);
        var remote = registry.remote(url);
        var refs = Repository.refs(remote);
        var release = 'release';
        var source  = (()=>{
            for(var branch of Object.keys(refs.heads)){
                if(refs.heads[branch] == refs.head){
                    return branch;
                }
            }
            return branches[0];
        })();
        if(refs.tags) {
            var versions = Object.keys(refs.tags).map(v=> {
                return {
                    version: v,
                    sha: refs.tags[v]
                }
            });
        }
        var local = Library.local(url);
        return {
            name       : url.project,
            vendor     : url.vendor,
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
    get refs(){

    }

    get git():Repository {
        var v:Repository = this[GIT];
        if(!v){
            v = this[GIT] = new Repository(this.local);
            /*
            if(v.init()){
                v.addRemote('origin',this.registry.remote(this.url))
            }*/
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

    install(dev?=false){
        if(!this.git.initialized){
            this.git.init();
        }
        var remotes = this.git.remotes();
        if(!remotes[this.registry.id]){
            this.git.exec('config','--local',`remote.${this.registry.id}.url`,this.registry.remote(this.url));
            this.git.exec('config','--local','--add',`remote.${this.registry.id}.fetch`, `+refs/tags/*:refs/tags/*`);
            this.git.exec('config','--local','--add',`remote.${this.registry.id}.fetch`, `+refs/release/*:refs/release/*`);
            if(dev) {
                this.git.exec('config', '--local', '--add', `remote.${this.registry.id}.fetch`, `+refs/heads/*:refs/remotes/${this.registry.id}/*`);
            }
            this.git.hook('post-commit',`
                #!/usr/bin/env node
                console.info('Post Commit');
                console.info(process.argv);
            `.trim());
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

    cached(){
        console.info(this.url.registry,this.url.vendor,this.url.project);
    }
}