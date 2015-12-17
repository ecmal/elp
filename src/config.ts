import FS from './utils/fs';

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
        username : process.env.USER,
        password : ''
    };

    constructor(){
        this.name = 'espm';
        this.home = FS.resolve(this.env.home,'.'+this.name);
        this.config = FS.resolve(this.home,'config.json');
        this.dirname = __dirname;
        this.filename = __filename;
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
    private checkRegistries(){}
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