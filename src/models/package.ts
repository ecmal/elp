import FileSystem from "../utils/fs";

export class Package {
    static read(path:string){
        let pack;
        path = FileSystem.resolve(path);
        if(!FileSystem.exists(path)){
            console.error(`Invalid project path "${path}"`);
        }
        if(FileSystem.isDir(path)){
            path = FileSystem.resolve(path,'package.json');
        }
        if(FileSystem.isFile(path)){
            pack = new Package(path);
        }
        return pack;
    }
    private internal:any;
    private json:any;
    public path:string;

    get name():string {
        return this.json.name;
    }
    set name(v:string){
        this.json.name=v;
    }
    get registry():string{
        return this.json.registry;
    }
    set registry(v:string){
        this.json.registry = v;
    }
    get vendor(){
        return this.json.vendor;
    }
    get version(){
        return this.json.version;
    }
    get directories(){
        if(!this.json.directories){
            this.json.directories = {
                source : './source',
                output : './output'
            }
        }
        return this.json.directories;
    }
    get dirname(){
        return FileSystem.dirname(this.filename);
    }
    get filename(){
        return this.path;
    }

    get sourceDir():string {
        return FileSystem.resolve(this.dirname,this.directories.source);
    }
    set sourceDir(v:string){
        this.directories.source = FileSystem.relative(this.dirname,v);
    }
    get outputDir():string {
        return FileSystem.resolve(this.dirname,this.directories.output);
    }
    set outputDir(v:string){
        this.directories.output = FileSystem.relative(this.dirname,v);
    }

    patch(props:any){
        for(var key in props){
            this.json[key] = props[key];
        }
        return this;
    }
    constructor(path,json?){
        this.path = path;
        if(!this.json){
            this.read(path);
        }
    }

    clone():Package{
        return new Package(this.path,JSON.parse(JSON.stringify(this.json)));
    }
    read(path){
        this.json = FileSystem.readJson(path);
    }
    toJSON(){
        return this.json;
    }
    write(path){
        FileSystem.writeJson(path,this.clone().patch({
            directories:{
                source:'.',
                output:'.'
            }
        }));
    }

}