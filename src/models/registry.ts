import {Url} from "./url";
import config from '../config';
import {Library} from "./library";
import FileSystem from "../utils/fs";

const ID:symbol = Symbol('id');
const REGISTRIES = {};

export class Registry {
    static get(url:Url):Registry {
        if(url.registry && REGISTRIES[url.registry]) {
            return <Registry>(new (<ObjectConstructor>REGISTRIES[url.registry])());
        }else{
            throw new Error(`Unknown registry '${url.registry}' for module '${url.url}'`);
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