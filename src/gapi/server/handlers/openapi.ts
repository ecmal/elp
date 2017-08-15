import system from "@ecmal/runtime";
import {cached} from "@ecmal/runtime/decorators";
import {Handler} from "../handler";
import {Exchange} from "../exchange";
import {Router,regexp} from "../router";

export type Index<T> = T[]&Dictionary<T>;

export class Operation {
    get id(){
        return `${this.moduleName}#${this.className}.${this.methodName}`;
    }
    get class(){
        return system.require(this.moduleName)[this.className];
    }
    get action(){
        return this.class.prototype[this.methodName];
    }
    get className(){
        return this.config['x-ecmal-class']
    }
    get moduleName(){
        return this.config['x-ecmal-module']
    }
    get methodName(){
        return this.config['x-ecmal-method']
    }

    get config(){
        return this.api.spec.paths[this.path][this.method];
    }

    constructor(private api:OpenApi, readonly path:string, readonly method:string){

    }

    public toString(){
        return `${this.constructor.name}(${this.id})`
    }

    public require(){
        if(!this.class){
            throw new Error(`Class missing for operation '${this.id}'`);
        }
        if(!this.action){
            throw new Error(`Class method missing for operation '${this.id}'`);
        }
        Object.defineProperty(this.action,'name',{
            value:this.methodName
        });
    }
}

export class Definition {
    constructor(api:OpenApi,name:string){
        Object.defineProperties(this,{
            api:{configurable:false,enumerable:false,value:api},
            name:{configurable:false,enumerable:false,value:name}
        })
    }
    readonly api:OpenApi;
    readonly name:string;

    get id(){
        return `${this.moduleName}#${this.className}`;
    }
    get class(){
        return system.require(this.moduleName)[this.className];
    }
    get className(){
        return this.config['x-ecmal-class']
    }
    get moduleName(){
        return this.config['x-ecmal-module']
    }
    get config(){
        return this.api.spec.definitions[this.name]
    }
    public toString(){
        return `${this.constructor.name}(${this.id})`
    }
    public require(){
        if(!this.class){
            throw new Error(`Class missing for definition '${this.id}'`);
        }
    }
}

export class Endpoint {
    constructor(api:OpenApi,path:string){
        function convertPath(path){
            let params = [];
            path = path.replace(/\{.*\}/g, s => {
                let param = s.substring(1, s.length-1);
                params.push(param);
                return `:${param}`;
            });
            return {path,params}
        }
        let enp = convertPath(path);
        let ops = api.spec.paths[path];
        let opm = {};
        for(let o in ops){
            let oParams = ops[o].parameters;
            let mParams = {};
            if(Array.isArray(oParams)){
                oParams.forEach((p,i)=>{
                    p.index = i;
                    mParams[p.name] = p;
                })
            }
            opm[o] = mParams;
            enp.params.forEach(p=>{
                let param = mParams[p];
                if(!(param.in=='path' && param.required)){
                    console.info("Invalid parameter",p,'in path',o,path)
                } else {
                    //todo extract regexp from parameter
                }
            })
        }

        Object.defineProperties(this,{
            route:{configurable:false,enumerable:false,value:enp.path},
            regexp:{configurable:false,enumerable:false,value:regexp(enp.path)},
            api:{configurable:false,enumerable:false,value:api},
            path:{configurable:false,enumerable:false,value:path},
        })
    }

    readonly api:OpenApi;
    readonly route:string;
    readonly regexp:RegExp;
    readonly path:string;

    @cached
    get operations():Index<Operation>{
        let map = [] as Index<Operation>;
        Object.keys(this.api.spec.paths[this.path]).forEach(method=>{
            let o = new Operation(this.api,this.path,method);
            map.push(map[o.id]=o);
        });
        return map;
    }

    public require(){
        this.operations.forEach(d=>d.require());
    }

    public match(path:string){
        return this.regexp.test(path);
    }

    public exec(request:any,response:any):any {
        let method      = request.method;
        let url         = request.url;
        let iHeaders    = request.headers;
        let iStream     = request.stream;
        let status      = response.status;
        let oHeaders    = response.headers;
        let oStream     = response.stream;
    }
}

export class OpenApi {
    constructor(readonly spec){
        function toTitleName(s){
            return s[0].toUpperCase()+s.substring(1);
        }
        function toClassName(name){
            return name.split(/[^\w]+/).map(w=>toTitleName(w)).join('');
        }
        let xEcmal = spec['x-ecmal'] || {};
        let oPaths = spec.paths;
        let oSchema = spec.definitions;
        let oTags = spec.tags;
        let xTags = {};
        oTags.forEach(tag=>{
            let xModule = tag['x-ecmal-module'] || xEcmal.controllers;
            let xController = toClassName(tag['x-ecmal-class'] || tag.name);
            xTags[xController] = Object.assign(tag,{
                'x-ecmal-module':xModule,
                'x-ecmal-class':xController,
            });
        });
        Object.keys(oPaths).forEach(p=>{
            let path = oPaths[p];
            for(let a in path){
                let action = path[a];
                let tags = path[a].tags;
                if(tags){
                    for(let t=0;t<tags.length;t++){
                        let tag = tags[t];
                        let xTag = xTags[toClassName(tag)]||{};
                        if(xTag){
                            let xModule = action['x-ecmal-module'] || xTag['x-ecmal-module'];
                            let xController = action['x-ecmal-class'] || xTag['x-ecmal-class'];
                            let xAction = action['x-ecmal-method'] || action.operationId;
                            Object.assign(action,{
                                'x-ecmal-module':xModule,
                                'x-ecmal-class':xController,
                                'x-ecmal-method':xAction
                            });
                            break;
                        }
                    }
                }
            }
        });
        Object.keys(oSchema).forEach(p=>{
            let oModel = oSchema[p];
            let xModule = oModel['x-ecmal-module'] || xEcmal.definitions;
            let xClass = oModel['x-ecmal-class'] || p;
            Object.assign(oModel,{
                'x-ecmal-module':xModule,
                'x-ecmal-class':xClass
            })
        });
        //console.info(JSON.stringify(spec,null,2));
    }

    @cached
    get definitions():Index<Definition>{
        let map = [] as Index<Definition>;
        Object.keys(this.spec.definitions).forEach(name=>{
            let d = new Definition(this,name);
            map.push(map[d.id]=d);
        });
        return map;
    }

    @cached
    get endpoints():Index<Endpoint>{
        let map = [] as Index<Endpoint>;
        Object.keys(this.spec.paths).forEach(path=>{
            let e = new Endpoint(this,path);
            map.push(map[e.path]=e);
        });
        return map;
    }

    public require(){
        this.definitions.forEach(d=>d.require());
        this.endpoints.forEach(d=>d.require());
    }
}


export class OpenApiHandler extends Handler {
    protected router:Router;

    @cached
    public get api():OpenApi{
        return new OpenApi(this.options);
    }

    constructor(spec){
        super(spec);
        this.init()
    }

    init(){
        this.api.require();
        //this.api.definitions.forEach(d=>console.info(d.toString()));
        /*let ok;
        let classes = {};
        this.options.tags.forEach(tag=>{
            let [mid,cid] = tag['x-ecmal-class'].split('#');
            classes[tag.name] = system.require(mid)[cid];
        });

        for(let p in this.options.paths){
            let path = this.options.paths[p];
            for(let m in path){
                let method = path[m];
                if(!method.tags){
                    console.info(method);
                }else{
                    method.tags.forEach(t=>{
                        let controller = classes[t];
                        let operation = controller.prototype[method.operationId];
                        if(operation){
                            method.controller = controller;
                            method.operation = operation;
                        }else{
                            console.info(t,method.operationId);
                        }
                    })
                }
            }
            this.router.add(p,path);
        }*/
    }

    async process(exchange:Exchange){
        let url = exchange.request.url;
        let endpoint = this.api.endpoints.find(e=>e.match(url));
        if(endpoint){
            endpoint.exec(exchange.request,exchange.response);
        }
    }
}