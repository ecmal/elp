import FS from './utils/fs';
import {Registry} from "./models/registry";
import {BitbucketRegistry} from "./models/registry";
import {GithubRegistry} from "./models/registry";

const process = system.node.process;

export class Config {

    public name : string;
    public home : string;
    public config : string;
    public dirname : string;
    public filename : string;

    public env:any = {
        home : process.env.HOME,
        path : process.env.PATH
    };
    public settings:any = {
        username     : "none",
        password     : "none",
        github       : {
            url      : "https://github.com",
            pattern  : "https://github.com/%{vendor}/%{project}.git",
            username : "none",
            password : "none"
        },
        bitbucket    : {
            url      : "https://bitbucket.org",
            pattern  : "https://bitbucket.org/%{vendor}/%{project}.git",
            username : "none",
            password : "none"
        }
    };
    constructor(){
        this.name = 'elp';
        this.home = FS.resolve(this.env.home,'.'+this.name);
        this.config = FS.resolve(this.home,'config.json');
        this.dirname = system.node.dirname;
        this.filename = system.node.filename;
    }
    private checkHome(){
        if(!FS.isDir(this.home)){
            FS.createDir(this.home);
        }
    }

    private checkConfig(){
        if(!FS.isFile(this.config)){
            FS.writeJson(this.config,this.settings);
        }else{
            this.settings = FS.readJson(this.config);
        }
    }
    private checkRegistries(){
        Registry.add(BitbucketRegistry);
        Registry.add(GithubRegistry);
    }
    private checkPlugins(){}

    load():Promise<Config>{
        this.checkHome();
        this.checkConfig();
        this.checkPlugins();
        this.checkRegistries();
        return Promise.resolve(this);
    }
}

export default new Config()