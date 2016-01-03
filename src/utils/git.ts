import * as Cp from 'node/child_process';
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
    private git:Repository;
    private map:{[key:string]:Remote};
    constructor(git:Repository){
        this.git = git;
        this.list = [];
    }

    add(name,url){
        var result = this.git.exec('remote','add',name, url)
        if(result){
            console.info(result);
        }
    }

    has(name):boolean{
        return !!this.map[name];
    }

    get(name):Remote {
        return this.map[name];
    }

    sync(){
        this.list = [];
        var result = this.git.exec('remote','-v').stdout.trim();
        if(result){
            console.info(result);
        }
    }

}

export class Repository {

    public path:string;
    public base:string;

    public remotes:Remotes;

    exec(...args){
        var params = args.filter(a=>!!a);
        var result = Cp.spawnSync('git',params,{cwd:this.path});
        var output = Buffer.concat(result.output.filter(i=>(i && i.length))).toString();
        if(!!result.status){
            throw new Error(`Failed To Execute "git ${params.join(' ')}"\n\n`+output);
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
    getRemotes():string[]{
        return this.exec('remote').output.trim().split('\n');
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
        this.base = FileSystem.resolve(this.path,'.git');
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
}

