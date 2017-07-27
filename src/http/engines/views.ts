import {EJS} from "./ejs/compiler";

export interface Renderer {
    render(options,str);
}

export class Views {
    constructor(){
        this.set('ejs',new EJS());
    }
    private engines = new Map<string,Renderer>();
    public set(name,renderer:Renderer){
        this.engines.set(name,renderer);
    }
    public get(name):Renderer{
        return this.engines.get(name);
    }
    private static get default():Views{
        return Object.defineProperty(this,'default',{
            value : new Views()
        }).default;
    }
    public static define(name:string,renderer:Renderer){
        this.default.set(name,renderer);
    }
    public static engine(name?:string){
        if( !name ){
            return this.engine('ejs');
        }
        if( this.default.engines.has(name) ){
            return this.default.get(name);
        }
        return this.engine('ejs');
    }
}