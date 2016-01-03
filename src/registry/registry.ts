import * as Cp from "node/child_process";
import * as Https from "node/https";
import * as Zlib from "node/zlib";
import {Package} from "../models/package";

import {Repository} from "../utils/git";
import {FileSystem} from "../utils/fs";




export class Registry {
    private static map={};
    static get(name):Registry{
        return <Registry>(new (<ObjectConstructor>this.map[name].type)(name,this.map[name].options));
    }
    static add(name,type:any,options?:any){
        this.map[name] = {type,options};
    }

    protected name:string;
    protected home:string;
    protected path:string;
    protected pack:Package;

    protected config:any;
    protected options:any;

    protected get remoteBranch():string{
        return 'release';
    };
    protected get remoteUrl():string {
        return `${this.options.url}/${this.pack.vendor}/${this.pack.name}.git`
    }

    constructor(name,config:any){
        this.name = name;
        this.config = config;
        this.options = {};
        if(config.settings && config.settings[name]){
            for(var i in config.settings[name]){
                this.options[i] = config.settings[name][i];
            }
        }
    }
    prepare(path:string){
        this.pack = Package.read(path);
        this.home = FileSystem.resolve(this.config.home,'registry',this.name);
        this.path = FileSystem.resolve(this.home,this.pack.vendor,this.pack.name);
    }
    publish(path:string){
        throw new Error('abstract method Registry.publish');
    }
}
export class GitRepository extends Repository {

    static SOURCES_BRANCH:string = 'master';
    static RELEASE_BRANCH:string = 'release';

    private name:string;
    private url:string;

    private get released():boolean{
        return this.getRemote(this.name).hasBranch(GitRepository.RELEASE_BRANCH);
    }
    private get branch(){
        var result = this.exec('branch');
        var lines = result.output.split('\n');
        for(var l of lines){
            var b = l.match(/^\*\s+(.*)$/i);
            if(b){
                return b[1];
            }
        }
    }
    constructor(path:string,name:string,url:string){
        super(path);
        this.name = name;
        this.url = url;
        if(this.init()){
            this.addRemote(this.name,this.url,'-t',GitRepository.RELEASE_BRANCH);
        }
        this.fetchRemoteBranches();
        if(this.released){
            if(this.branch==GitRepository.RELEASE_BRANCH){
                this.updateReleaseBranch()
            }else{
                this.checkoutReleaseBranch();
            }
        }else{
            this.createReleaseBranch();
        }
        this.showStatus();
    }
    private fetchRemoteBranches(){
        this.exec('fetch',this.name)
    }
    private checkoutReleaseBranch(){
        this.exec('checkout','-b',GitRepository.RELEASE_BRANCH,`${this.name}/${GitRepository.RELEASE_BRANCH}`)
    }
    private updateReleaseBranch(){
        this.exec('pull');
    }
    private createReleaseBranch(){
        this.exec('checkout','--orphan',GitRepository.RELEASE_BRANCH);
    }
    private showStatus(){
        console.info(this.exec('status').output);
    }
    patch(pack:Package){
        var syncMap:any = {};
        console.info("REMOVE !",this.path);
        FileSystem.cleanDir(this.path,f=>{
            return f=='.git';
        });
        FileSystem.copyDir(pack.dirname,this.path);

        //console.info(FileSystem.readDir(this.path,true));
        this.exec('add','.');
        this.showStatus();
        this.exec('commit','-m','Release');
        this.showStatus();
        /*
        FileSystem.readDir(pack.dirname).map(f=>{
            var fName = FileSystem.relative(pack.dirname,f);
            var fPath = FileSystem.resolve(this.path,fName);
            FileSystem.copyFile(f,fPath);
            if(syncMap[fName]){
                syncMap[fName] = 'change';
            }else{
                syncMap[fName] = 'add';
            }
        });
        var added=[],removed=[];
        for(var fName in syncMap){
            if(syncMap[fName]=='remove'){
                removed.push(fName);
            }else{
                added.push(fName);
            }
        }
        if(added.length){
            console.info(this.repo.exec('add', ...added).stdout.toString());
        }
        if(removed.length){
            console.info(this.repo.exec('rm',...removed).stdout.toString());
        }*/
    }
    versions():string[]{
        return null;
    }
}
export class GitRegistry extends Registry {
    prepare(path){
        super.prepare(path);
        var repo = new GitRepository(this.path,this.name,this.remoteUrl);
        repo.patch(this.pack);
        //repo.commit();
        /*if(this.repo.init()){
            //this.repo.exec('remote', 'add', '-f', '-t', this.remoteBranch, '--no-tags', this.name, this.remoteUrl);
            //this.repo.exec('remote','show',this.name);
            //this.repo.exec('branch', '-r');
            this.repo.exec('ls-remote', this.remoteUrl);
        }*/
    }

    publish(path:string) {
        this.prepare(path);
    }

}

export class BitbucketRegistry extends GitRegistry {
    publish(path:string){
        super.publish(path);
        /*if(this.repo.hasRemoteBranch(this.name,this.remoteBranch)){
            this.repo.exec('fetch',this.name,this.remoteBranch);
            this.repo.exec('checkout','-b',this.remoteBranch,this.name+'/'+this.remoteBranch);
        }else{
            console.info(this.repo.exec('checkout','--orphan',this.remoteBranch).stderr.toString())
        }
        console.info(this.repo.path);
        var syncMap:any = {};
        FileSystem.readDir(this.repo.path).map(f=>{
            syncMap[FileSystem.relative(this.repo.path,f)]='remove';
        });
        console.info(this.pack.dirname);
        FileSystem.readDir(this.pack.dirname).map(f=>{
            var fName = FileSystem.relative(this.pack.dirname,f);
            var fPath = FileSystem.resolve(this.repo.path,fName);
            FileSystem.copyFile(f,fPath);
            if(syncMap[fName]){
                syncMap[fName] = 'change';
            }else{
                syncMap[fName] = 'add';
            }
        });
        var added=[],removed=[];
        for(var fName in syncMap){
            if(syncMap[fName]=='remove'){
                removed.push(fName);
            }else{
                added.push(fName);
            }
        }
        if(added.length){
            console.info(this.repo.exec('add', ...added).stdout.toString());
        }
        if(removed.length){
            console.info(this.repo.exec('rm',...removed).stdout.toString());
        }
        console.info(this.repo.exec('status').stdout.toString());
        console.info(this.repo.exec('commit','-m',`Publish version ${this.pack.version}`).stdout.toString());
        console.info("TAGGING",'tag','-a',this.remoteBranch+'/'+this.pack.version,'-m',`"Tagging version ${this.pack.version}"`);
        console.info(this.repo.exec('tag','-a',this.remoteBranch+'/'+this.pack.version,'-m',`"Tagging version ${this.pack.version}"`).stderr.toString());
        console.info(this.repo.exec('push','--set-upstream', this.name, this.remoteBranch).stdout.toString());
        console.info(this.repo.exec('push','--set-upstream', this.name, this.remoteBranch+'/'+this.pack.version).stdout.toString());*/
    }
    sync(){

    }
}

export class GithubRegistry extends GitRegistry {

}
