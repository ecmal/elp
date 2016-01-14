import * as Cp from 'node/child_process';
import * as Url from 'node/url';
import {FileSystem} from "./fs";

export abstract class Entity {

    private static REPO:symbol=Symbol('repo');

    protected [Entity.REPO]:Repository;
    public get repo():Repository{
        return this[Entity.REPO];
    }

    constructor(repo:Repository){
        this[Entity.REPO] = repo;
    }

    abstract parse(data:string):T;
}

export class Remote extends Entity {

    private static REFS:symbol=Symbol('branches');
    private static TAGS:symbol=Symbol('branches');
    private static BRANCHES:symbol=Symbol('branches');

    protected [Remote.REFS]:{[key:string]:string};
    protected [Remote.BRANCHES]:string[];
    protected [Remote.TAGS]:string[];

    public get refs():{[key:string]:string}{
        return this[Remote.REFS];
    }
    public get branches():string[]{
        var list = this[Remote.BRANCHES];
        if(!list){
            list = this[Remote.BRANCHES]=[];
            for(var ref in this.refs){
                var arr = ref.match(/^refs\/heads\/(.*)$/);
                if(arr){
                    list.push(arr[1]);
                }
            }
        }
        return list;
    }
    public get tags():string[]{
        var list = this[Remote.TAGS];
        if(!list){
            list = this[Remote.TAGS]=[];
            for(var ref in this.refs){
                var arr = ref.match(/^refs\/tags\/(.*)$/);
                if(arr){
                    list.push(arr[1]);
                }
            }
        }
        return list;
    }
    hasTag(name){
        return this.tags.indexOf(name)>=0;
    }
    hasBranch(name){
        return this.branches.indexOf(name)>=0;
    }
    inspect(){
        return {
            refs     : this.refs,
            branches : this.branches,
            tags     : this.tags
        }
    }
    parse(data:string):Remote {
        var refs = this[Remote.REFS] = {};
        data.trim().split('\n').forEach(l=>{
            var r = l.trim().split(/\s+/);
            refs[r[1]]=r[0];
        });
        return this;
    }
}

export class Remotes {

}
class Status {

    local   : string;
    remote  : string;
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
                this.local = thead[0];
            }
            if(thead[1]){
                this.remote = thead[1];
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
                return a-b;
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

}
export interface Remotes {
    [k:string]:Remote;
}

export class Repository {
    private static parseRefs(text:string){
        var remote = {};
        text.trim().split('\n').forEach(r=>{
            var [sha,ref] = r.trim().split(/\s+/);
            var r = ref.split('/');
            var t = r.shift();
            var type = r.shift();
            var name = r.join('/');
            if(t=='HEAD'){
                remote.head = sha;
            }else{
                if(!remote[type]){
                    remote[type]={[name]:sha}
                }else{
                    remote[type][name]=sha;
                }
            }
        });
        return remote;
    }
    static isGitDir(path):boolean{
        return FileSystem.isDir(FileSystem.resolve(path,'.git'));
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
        var output:Buffer|string;
        output = Buffer.concat(result.output.filter(i=>(i && i.length)));
        if(!binary){
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
    getRemote(remote:string,pattern?:string){
        var result = this.exec('ls-remote','--tags','--heads',remote,pattern);
        if(result.output){
            return new Remote(this).parse(result.output);
        }else{
            throw new Error(`Invalid remote "${remote}" ${output}`)
        }
    }

    hasRemote(name):boolean {
        return this.getRemotes().indexOf(name)>=0;
    }
    addRemote(name,url,...options):void{
        this.exec('remote','add',...options,name,url);
    }
    getRemoteBranches(remote,...params){
        var result = this.exec('ls-remote',remote,...params).stdout.trim();
        if(result){
            return result.split('\n').map(l=>{
                l = l.split(/\s+/);
                var data = {type:'',name:'',sha:l[0],ref:l[1],remote};
                if(data.ref=='HEAD'){
                    data.type = 'head';
                    data.name = data.ref;
                }else {
                    data.type = data.ref.split('/')[1];
                    data.name = data.ref.split('/').splice(2).join('/');
                    switch (data.type) {
                        case 'heads' :
                            data.type = 'branch';
                            break;
                        case 'tags'  :
                            data.type = 'tag';
                            break;
                    }
                }
                return data;
            });
        }
    }
    hasRemoteBranch(remote,name):boolean{
        var branches = this.getRemoteBranches(remote);
        for(var branch of branches){
            if(branch.name==name){
                return true;
            }
        }
        return false;
    }
    constructor(path:string){
        this.path = path;
    }
    init():boolean{
        if(!FileSystem.isDir(this.path)){
            FileSystem.createDir(this.path,true);
        }
        if(!FileSystem.isDir(this.base)){
            this.exec('init');
            return true;
        }else{
            return false;
        }
    }
    clear(){
        FileSystem.readDir(this.path,false,true).forEach(f=>{
            if(f!=this.base){
                if(FileSystem.isDir(f)){
                    FileSystem.removeDir(f);
                }else{
                    FileSystem.removeFile(f);
                }
            }
        })
    }
    remote(name):string{
        return this.exec('remote','show',name).output;
    }
    remotes():Remotes{
        var remotes:Remotes = {};
        this.exec('remote','-v').output.trim().split('\n').forEach(r=>{
            var [name,url,type] = r.trim().split(/\s+/);
            var remote = remotes[name];
            if(!remote){
                remote = remotes[name]={name};
            }
            remote[type.replace(/^\((.*)\)$/,'$1')] = url;
        });
        for(var r in remotes){
            var remote:any = remotes[r];

            var url = Url.parse(remote.fetch||remote.push);
            var path = url.pathname.replace(/(.*)(?:\.git)$/,'$1').split('/');
            var [user,pass] = url.auth.split(':');
            url.auth = null;
            remote.url =Url.format(url);
            remote.protocol = url.protocol.substring(0,url.protocol.length-1);
            remote.host = url.host;
            remote.user = user;
            remote.project = path.pop();
            remote.vendor = path.pop();
            switch(url.hostname){
                case 'bitbucket.org' :remote.registry = 'bitbucket';break;
                case 'github.com'    :remote.registry = 'github';break;
            }
            if(pass){
                remote.pass = pass;
            }
            var refs=Repository.parseRefs(this.exec('ls-remote',r).output);
            for(var i in refs){
                remote[i] = refs[i];
            }
        }
        return remotes;
    }
    status():Status {
        return new Status(this.exec('status', '--porcelain','--branch','--untracked-files=all').output);
    }
    refs(){
        return Repository.parseRefs(this.exec('show-ref','--head').output);
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
    log():Log {
        var header = ['sha','tree','parent','commit.date'];
        var format = '%H,%T,%P,%aI,%s,%b,%D,%N,%an,%ae'.split(',').join('\u001F');
        return this.exec('log', "--pretty=format:"+format,'--all').output.split('\n').map(l=>{
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

    public toString(){
        return `Git(${this.base})`;
    }
    protected inspect(){
        return this.toString()
    }
}
