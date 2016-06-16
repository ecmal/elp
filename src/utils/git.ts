import {FileSystem} from "./fs";

const Cp                = system.node.require('child_process');
const URL               = system.node.require('url');
const process           = system.node.process;
const REFS:symbol       = Symbol('refs');
const TAGS:symbol       = Symbol('tags');
const BRANCHES:symbol   = Symbol('branches');
const REPO:symbol       = Symbol('repo');

export abstract class Entity {

    protected [REPO]:Repository;
    public get repo():Repository{
        return this[REPO];
    }

    constructor(repo:Repository){
        this[REPO] = repo;
    }

    abstract parse(data:string):any;
}



export class Status {

    local   : any;
    remote  : any;
    ahead   : number;
    changes : any;
    initial : boolean;
    clear   : boolean;

    constructor(status) {
        var line,item,whitespace = /\s+/;
        var lines = status.trim().split('\n');
        var thead = lines.shift().trim();
        var initial = thead.match(/##\sInitial\scommit\son\s(.*)\s*/)
        if(initial){
            this.initial = true;
            this.local = initial[1]
        }else{
            thead = thead.replace('...',' ');
            thead = thead.replace(/(#|\s)+/,'');
            thead = thead.replace(/\[ahead\s(\d+)\]/,'$1');
            thead = thead.trim().split(/\s+/);
            if(thead[0]){
                var local = thead[0];
                this.local = {
                    branch  : local
                };
            }
            if(thead[1]){
                var parts  = thead[1].split('/');
                var remote = parts[0];
                var branch = parts[1];
                this.remote = {
                    branch  : branch,
                    name    : remote
                };
            }
            if(thead[2]){
                this.ahead = thead[2]?parseInt(thead[2]):0;
            }

        }

        var changes = {};
        while (line = lines.shift()) {
            item = {};
            line = line.trim().split(whitespace);
            var actions = line.shift();
            item.path = line.shift();
            if(actions.indexOf('A')>=0){
                item.added = true;
            }
            if(actions.indexOf('M')>=0){
                item.modified = true;
            }
            if(actions.indexOf('D')>=0){
                item.deleted = true;
            }
            if(actions.indexOf('R')>=0){
                line.shift();
                item.renamed = true;
                item.from = item.path;
                item.path = line.shift();
            }
            if(actions.indexOf('!')>=0){
                item.ignored = true;
            }
            if(actions.indexOf('?')>=0){
                item.untracked = true;
            }
            changes[item.path] = item;
        }
        var files = Object.keys(changes).sort((a,b)=>{
            if(a.indexOf('/')>0 && b.indexOf('/')<0){
                return -1;
            }else
            if(a.indexOf('/')<0 && b.indexOf('/')>0){
                return 1;
            }else{
                return a==b?0:(a<b?-1:1);
            }
        });
        if(files.length) {
            this.clear = false;
            this.changes = {};
            files.forEach(f=> {
                this.changes[f] = changes[f];
            })
        }else{
            this.clear = true;
        }
    }
}

export interface Remote {
    name:string;
}
export interface Remotes {
    [k:string]:Remote;
}

export class Repository {
    static refs(url:string){
        return Repository.parseRefs(new Repository(process.cwd()).exec('ls-remote',url).output)
    }
    static clear(dir){
        var gidDir = FileSystem.resolve(dir,'.git');
        FileSystem.readDir(dir,false,true).forEach(f=>{
            if(f!=gidDir){
                if(FileSystem.isDir(f)){
                    FileSystem.removeDir(f);
                }else{
                    FileSystem.removeFile(f);
                }
            }
        })
    }
    private static parseRefs(text:string){
        var refs:any = {};
        text.trim().split('\n').forEach(r=>{
            var [sha,ref] = r.trim().split(/\s+/);
            var a = ref.split('/');
            var t = a.shift();
            var type = a.shift();
            var name = a.join('/');
            if(t=='HEAD'){
                refs.head = sha;
            }else{
                if(!refs[type]){
                    refs[type]={[name]:sha}
                }else{
                    refs[type][name]=sha;
                }
            }
        });
        if(refs.remotes){
            var remotes = {};
            Object.keys(refs.remotes).forEach(k=>{
                var sha = refs.remotes[k];
                var [remote,name] = k.split('/');
                delete refs.remotes[k];
                if(name=='HEAD'){
                    if(!remotes[remote]){
                        remotes[remote] = {head:sha}
                    }else{
                        remotes[remote].head = sha
                    }
                }else{
                    var heads;
                    if(!remotes[remote]){
                        remotes[remote] = heads = {heads:{}}
                    }else{
                        remotes[remote].heads = heads = {}
                    }
                    heads[name] = sha;
                }

            });
            refs.remotes = remotes;
        }
        if(refs.releases){
            var releases = {};
            Object.keys(refs.releases).forEach(k=>{
                var sha = refs.releases[k];
                var [ver,commit] = k.split('/');
                delete refs.releases[k];
                var commits = releases[ver];
                if(!commits){
                    commits = releases[ver]= {}
                }
                commits[commit] = sha;
            });
            refs.releases = releases;
        }
        return refs;
    }
    static isGitDir(path):boolean{
        return FileSystem.exists(FileSystem.resolve(path,'.git'));
    }
    public path:string;

    get base():string{
        return FileSystem.resolve(this.path,'.git');
    };

    exec(...args){
        var binary = false;
        var params = args.filter(a=>{
            if(a=='--binary'){
                return !(binary=true);
            }else{
                return !!a
            }
        });
        var result = Cp.spawnSync('git',params,{
            cwd : this.path
        });
        var output:string;
        if(result.output){
            output = result.output.filter(i=>(i && i.length>0)).map(i=>i.toString()).join('');
        }
        if(!binary && output){
            output = output.toString();
        }
        if(!!result.status){
            throw new Error(`Failed To Execute "git ${params.join(' ')}" for "${this.path}"\n\n`+output);
        }
        return {
            status  : !result.status,
            command : 'git '+params.join(' '),
            output  : output
        };
    }
    hook(name,content){
        var file,gitDir = this.path;
        if(FileSystem.extname(gitDir)=='.git'){
            file = FileSystem.resolve(this.path,'hooks',name);
        }else{
            file = FileSystem.resolve(this.base,'hooks',name);
        }
        console.info('INSTALL HOOK',name,file);
        FileSystem.writeFile(file, content);
        FileSystem.chmodFile(file, '755');
    }
    head(ref:string){
        var gitDir = this.base;
        if(FileSystem.isFile(gitDir)){
            gitDir = FileSystem.readFile(gitDir).toString().replace('gitdir:','').trim();
        }
        if(FileSystem.isDir(gitDir)){
            FileSystem.writeFile(FileSystem.resolve(gitDir,'HEAD'),`ref: ${ref}`);
        }else{
            throw new Error(`Not a git dir '${gitDir}'`);
        }
    }
    config():any{
        var fm = {},mp={};
        this.exec('config','-l').output.trim().split('\n').forEach(p=>{
            var [key,val] = p.split('=');
            if(fm[key]){
                if(Array.isArray(fm[key])){
                    fm[key].push(val);
                }else {
                    fm[key] = [fm[key],val];
                }
            }else{
                fm[key] = val;
            }
        });
        Object.keys(fm).forEach(k=>{
            var path = k.split('.');
            var root = mp,key;
            while(key=path.shift()){
                if(path.length){
                    root = root[key] = (root[key] || {})
                }else{
                    var val = fm[k];
                    if(typeof val=='string'){
                        if(val.match(/^(true|false)$/)){
                            val = (fm[k]==true);
                        }else
                        if(val.match(/^\d+$/)){
                            val = parseInt(fm[k]);
                        }else
                        if(val.match(/^\d+\.\d+$/)){
                            val = parseFloat(fm[k]);
                        }
                    }
                    root[key] = val;
                }
            }
        });
        return mp;
    }


    hasRemote(name):boolean {
        return !!this.remotes()[name];
    }
    addRemote(name,url,...options):void{
        this.exec('remote','add',...options,name,url);
    }

    constructor(path:string){
        this.path = path;
    }
    get initialized():boolean {
        return FileSystem.isDir(this.path) && (
            FileSystem.isFile(FileSystem.resolve(this.path,'config')) ||
            FileSystem.isFile(FileSystem.resolve(this.path,'.git','config'))
        );
    }
    clear(){
        Repository.clear(this.path);
    }
    init():boolean{
        if(!FileSystem.isDir(this.path)){
            FileSystem.createDir(this.path,true);
        }
        if(!FileSystem.isDir(this.base)){
            if(FileSystem.extname(this.path)=='.git'){
                this.exec('init','--bare');
            }else{
                this.exec('init');
            }
            return true;
        }else{
            return false;
        }
    }
    fetch(remote,branch?){
        if(branch){
            return this.exec('fetch',remote,branch).output;
        }else{
            return this.exec('fetch',remote).output;
        }
    }

    remote(name):string{
        return this.exec('remote','show',name).output;
    }
    remotes():Remotes{
        var remotes:Remotes = {};
        this.exec('remote','-v').output.trim().split('\n').forEach(r=>{
            var row = r.trim();
            if(row){
                var [name,url,type] = row.split(/\s+/);
                var remote:any = remotes[name];
                if(!remote){
                    remote = remotes[name]=<Remote>{name};
                }
                remote[type.replace(/^\((.*)\)$/,'$1')] = url;
            }
        });
        for(var r in remotes){
            var remote:any = remotes[r];
            var refs=Repository.parseRefs(this.exec('ls-remote',r).output);
            for(var i in refs){
                remote[i] = refs[i];

            }
            var url = URL.parse(remote.fetch || remote.push);
            delete url.auth;
            remote.url = URL.format(url);
        }
        return remotes;
    }
    status():Status {
        var status = new Status(this.exec('status', '--porcelain', '--branch', '--untracked-files=all').output);
        if(status.local && status.local.branch){
            status.local.commit = this.rev(status.local.branch)
        }
        if(status.remote && status.remote.branch){
            status.remote.commit = this.rev(status.remote.name+'/'+status.remote.branch);
        }
        return status;
    }
    rev(name){
        return String(this.exec('rev-parse',name).output).trim()
    }
    refs(remote?){
        if(remote){
            return Repository.parseRefs(this.exec('ls-remote',remote).output)
        }else{
            return Repository.parseRefs(this.exec('show-ref','--head').output);
        }
    }
    readDir(branch='HEAD',base?){
        var tree = branch,ref='head';
        if(!tree.match(/^[a-f0-9]{40}$/)){
            var refs = this.refs();
            if(tree=='HEAD'){
                tree = refs.head;
                for(var name in refs.heads){
                    if(refs.head == refs.heads[name]){
                        ref = 'branch';
                        branch = name;
                        break;
                    }
                }
            }else
            if(refs.heads[tree]){
                ref = 'branch';
                tree = refs.heads[tree];
            }else
            if(refs.tags[tree]){
                ref = 'tag';
                tree = refs.tags[tree];
            }
        }

        var files = {};
        this.exec('ls-tree','-rl',branch+(base?':'+base:'')).output.trim().split('\n').forEach(l=>{
            var [mode,type,sha,size,path] = l.split(/\s+/);
            files[path] = {
                path    : path,
                type    : type,
                sha     : sha,
                tree    : tree,
                ref     : ref,
                branch  : branch,
                base    : 'git:'+branch+':/'+base,
                git     : this.path,
                mode    : parseInt(mode),
                size    : parseInt(size)
            };
        });
        return files;
    }
    readFile(branch,path?){
        return this.exec('show','--binary',path?branch+':'+path:branch).output;
    }
    log(obj?:string,count?:number):any {
        var header = ['sha','tree','parent','commit.date'];
        var format = '%H,%T,%P,%aI,%s,%b,%D,%N,%an,%ae'.split(',').join('\u001F');
        var options = [];
        if(obj){
            options.push(obj)
        }
        if(typeof count=='number'){
            options.push(count)
        }
        return this.exec('log', "--pretty=format:"+format,...options).output.split('\n').map(l=>{
            var r:any = l.split('\u001F');
            r = {
                commit    : r[0],
                tree      : r[1],
                parent    : r[2],
                date      : new Date(r[3]),
                subject   : r[4],
                body      : r[5],
                refs      : r[6],
                notes     : r[7],
                author    : {
                    name  : r[8],
                    email : r[9],
                }
            };
            for(var i in r){
                if(r[i]===''){
                    delete r[i];
                }
            }
            return r;
        });
    }

    tag(name,ref?){
        var result;
        if(ref){
            result = this.exec('tag',name,ref)
        }else{
            result = this.exec('tag',name)
        }
        return result.output;
    }
    push(remote,ref,tags?:boolean){
        var result;
        if(tags){
            result = this.exec('push',remote,'--tags',ref)
        }else{
            result = this.exec('push',remote,ref)
        }
        return result.output;
    }
    public toString(){
        return `Git(${this.base})`;
    }
    protected inspect(){
        return this.toString()
    }
}
