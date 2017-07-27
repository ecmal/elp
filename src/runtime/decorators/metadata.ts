import {Mirror} from "../reflect";

export function Meta(object:object)
export function Meta(key:string,value:any)
export function Meta(key:any,value:any)
export function Meta(target:any,value?:any):ClassDecorator{
    return meta(target,value);
}

export function meta(object:object)
export function meta(key:string,value:any)
export function meta(target:any,value?:any):MethodDecorator|PropertyDecorator|ParameterDecorator {
    let metas = target;
    if(typeof target !='object'){
        metas = {[target]:value||true};
    }
    return (target,key:string,desc:PropertyDescriptor)=>{
        let mirror = Mirror.new(target,key,desc);
        if(mirror.isMethod() && typeof desc=='number'){
            mirror = mirror.getParameter(desc);
        }
        Object.keys(metas).forEach(k=>{
            mirror.setMetadata(k,metas[k]);
        });
        Object.getOwnPropertySymbols(metas).forEach(k=>{
            mirror.setMetadata(k,metas[k]);
        });
    }
}