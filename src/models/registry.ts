import {Url} from "./url";
import config from '../config';
import FileSystem from "../utils/fs";

const URL           = system.node.require('url');
const ID:symbol     = Symbol('id');
const REGISTRIES    = {};


export class Registry {

    static for(url):Registry{
        var regs:Registry[] = this.all();
        for(var reg of regs){
            if(reg.matches(url)){
                return reg;
            }
        }
        return null;
    }

    static all():Registry[]{
        return Object.keys(REGISTRIES).map(k=>this.get(k));
    }
    static get(url:string|Url):Registry {
        var name:string;
        if(url instanceof Url){
            name = url.registry;
        }else{
            name = <string>url;
        }
        if(name && REGISTRIES[name]) {
            return <Registry>(new (<ObjectConstructor>REGISTRIES[name])());
        }else{
            throw new Error(`Unknown registry '${name}' for module '${url}'`);
        }
    }
    static add(type:any){
        REGISTRIES[type[ID]] = type;
    }
    get id(){
        return this.constructor[ID];
    }
    get options(){
        return config.settings[this.id]
    }
    remote(url){
        return this.options.pattern
            .replace('%{vendor}',url.vendor)
            .replace('%{project}',url.project);
    }
    matches(url){
        var u1 = URL.parse(url);
        var u2 = URL.parse(this.options.pattern);
        return u1.hostname == u2.hostname;
    }
    local(url){
        return FileSystem.resolve(config.home,'registry',url.vendor,url.project);
    }
    toString(){
        return `Registry(${this.id},${JSON.stringify(this.options,null,2)})`;
    }
    inspect(){
        return this.toString();
    }
}

export class GitRegistry extends Registry {

}
export class BitbucketRegistry extends GitRegistry {
    static [ID] = 'bitbucket';
}
export class GithubRegistry extends GitRegistry {
    static [ID] = 'github';
}