import {cached} from "@ecmal/runtime/decorators";
import source from './sources/mime';

export class Mime {
    private extensions:any;
    private types:any;
    constructor(){
        this.types = Object.create(null);
        this.extensions = Object.create(null);
    }
    public define(map:any){
        for (let type in map) {
            let exts = map[type];
            for (let i = 0; i < exts.length; i++) {
                this.types[exts[i]] = type;
            }

            if (!this.extensions[type]) {
                this.extensions[type] = exts[0];
            }
        }
    }
    public lookup(path, fallback){
        let ext = path.replace(/.*[\.\/\\]/, '').toLowerCase();
        return this.types[ext] || fallback;
    }
    public extension(mimeType){
        let type = mimeType.match(/^\s*([^;\s]*)(?:;|\s|$)/)[1].toLowerCase();
        return this.extensions[type];
    }
    public charset(mimeType, fallback){
        return (/^text\//).test(mimeType) ? 'UTF-8' : fallback;
    }
    @cached
    public static get default(){
        let mime = new Mime();
        mime.define(Mime.normalized());
        return mime;
    }
    static isCompressible (type):boolean {
        if (!type || typeof type !== 'string') {
            return false
        }
        let compressibleTypeRegExp = /^text\/|\+json$|\+text$|\+xml$/i
        let extractTypeRegExp = /^\s*([^;\s]*)(?:;|\s|$)/

        let match = extractTypeRegExp.exec(type);
        let mime = match && match[1].toLowerCase();
        let data = source[mime];

        if (data && data.compressible !== void 0) {
            return data.compressible
        }

        return compressibleTypeRegExp.test(mime);
    }
    static normalized(){
        let types = {};
        Object.keys(source).forEach(key=>{
            let mime = source[key];
            if( mime.extensions ){
                types[key] = mime.extensions
            }
        });
        return types
    }
}