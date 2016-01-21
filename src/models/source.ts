import * as Crypto from "node/crypto";
import FileSystem from "../utils/fs";
const EXTS = {
    '.d.ts'     : 'definition',
    '.ts'       : 'source',
    '.js.map'   : 'map',
    '.js'       : 'script'
};

export class Source {
    static isResource(ext):boolean{
        return ['.ts','.d.ts','.js','.js.map'].indexOf(ext)<0;
    }
    static getHash(content){
        return Crypto.createHash('md5').update(content).digest("hex");
    }
    static getName(path){
        var exts = Object.keys(EXTS);
        for(var e of exts){
            var i = path.lastIndexOf(e);
            if(i>0 && i==path.length-e.length){
                return path.substring(0,i)
            }
        }
        if(path.lastIndexOf('.')>0){
            return path.substring(0,path.lastIndexOf('.'));
        }else{
            return path;
        }

    }
    static getExt(path){
        var exts = Object.keys(EXTS);
        for(var e of exts){
            var i = path.lastIndexOf(e);
            if(i==path.length-e.length){
                return e;
            }
        }
        if(path.lastIndexOf('.')>0){
            return path.substring(path.lastIndexOf('.'));
        }
    }
    static getType(path){
        var exts = Object.keys(EXTS);
        for(var e of exts){
            var i = path.lastIndexOf(e);
            if(i==path.length-e.length){
                return EXTS[e];
            }
        }
        return 'resource'
    }
    public name:string;
    public project:string;
    public files:any;
    public main:boolean;
    get uri(){
        return this.project+'/'+this.name;
    }
    get ts(){
        return this.files['.ts'];
    }
    get js(){
        return this.files['.js'];
    }
    get tsx(){
        return this.files['.tsx']
    }
    get tsd(){
        return this.files['.d.ts']
    }
    get map(){
        return this.files['.js.map'];
    }
    get version(){
        var file = (this.ts || this.tsx || this.tsd);
        if(file && file.content){
            return String(file.hash);
        }
    }
    get content(){
        var file = (this.ts || this.tsx || this.tsd);
        if(file && file.content){
            return file.content.toString();
        }
    }
    get script(){
        return this.files['.js'];
    }

    get resources(){
        return Object.keys(this.files).filter(k=>Source.isResource(k)).map(k=>this.files[k])
    }
    get compilable(){
        return !!(this.files['.ts'] || this.files['.tsx'])
    }
    constructor(project:string,name:string,main=true){
        this.main = main;
        this.project = project;
        this.name = name;
        this.files = {};
    }
    mapTo(dir){
        if(this.map) {
            var map = JSON.parse(this.map.content.toString());
            delete map.sourceRoot;
            map.sources = map.sources.map(s=> {
                return s.replace(this.project+'/', './');
            });
            this.files['.js.map'].content = JSON.stringify(map);
        }
    }
    addFile(file){
        var old = this.files[file.ext];
        if(!old){
            old = this.files[file.ext] = {};
        }
        for(var i in file){
            old[i] = file[i];
        }
        old.size = old.content.length;
        old.hash = Source.getHash(old.content);
    }

    toString(full:boolean=false){
        var fStr = '';
        if(full){
            for(var f in this.files){
                var file = this.files[f];
                fStr+=`\n  ${[
                    file.ext,
                    file.hash,
                    file.content.length
                ].join('\t')}`;
            }
        }
        return `Source('${this.uri}',${this.main?'Y':'N'},[${full?fStr+'\n':Object.keys(this.files).join(' ')}])`
    }
    toMetadata(){
        var meta = {
            name    : this.name,
            version : this.version,
            size    : this.js?this.js.size:undefined,
            hash    : this.js?this.js.hash:undefined
        };
        return meta;
    }
    protected inspect(){
        return this.toString();
    }
}