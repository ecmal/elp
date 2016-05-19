const NREG = '[a-zA-Z][a-zA-Z0-9_$\\-\\.]*';
const VREG = 'v?[^]?(?:0|[1-9][0-9]*)\\.(?:0|[1-9][0-9]*|x)\\.(?:0|[1-9][0-9]*|x)(?:-[\\da-z\\-]+(?:\\.[\\da-z\\-]+)*)?(?:\\+[\\da-z\\-]+(?:\\.[\\da-z\\-]+)*)?';
const PREG = `^(?:(${NREG}):)?(?:(${NREG})\/)?(${NREG})?(?:#?(${VREG})?)$`;
const REGX = new RegExp(PREG,'i');

export class Url {
    static isValid(url:string){
        return REGX.test(url);
    }
    static stringify(url:any):string{
        if(!(url instanceof Url)){
            url = new Url(url);
        }
        return url.toString();
    }
    static parse(url:string):Url{
        return new Url(url)
    }

    public registry:string;
    public vendor:string;
    public project:string;
    public version:string;
    public url:string;

    constructor(url:string|any,parent?:Url){
        if(url && typeof url=='string'){
            this.registry = parent?parent.registry :null;
            this.vendor   = parent?parent.vendor   :null;
            this.project  = parent?parent.project  :null;
            this.version  = parent?parent.version  :null;
            this.parse(url);
        }else
        if(url && typeof url=='object'){
            this.registry = url.registry || parent.registry || null;
            this.vendor   = url.vendor   || parent.vendor   || null;
            this.project  = url.project  || parent.project  || null;
            this.version  = url.version  || parent.version  || null;
        }
    }
    public parse(url:string):boolean{
        var match = url.match(REGX);
        if(match){
            this.registry = match[1]||this.registry;
            this.vendor   = match[2]||this.vendor;
            this.project  = match[3]||this.project;
            this.version  = match[4]||this.version;
            this.stringify();
            return true;
        }else{
            return false;
        }
    }
    public stringify():string{
        return this.url = `${this.registry?this.registry+':':''}${
            this.vendor?this.vendor+'/':''
        }${
            this.project?this.project:''
        }${
            (this.vendor||this.project)&& this.version?'#':''
        }${
            this.version?this.version:''
        }`;
    }
    public toString(){
        return `Lib(${this.url})`;
    }
}