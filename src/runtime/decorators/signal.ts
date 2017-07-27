export type Slot<T extends Function> = T & Signal<T>
export class Signal<T extends Function> extends Function {
    readonly owner:any;
    get length(){
        return this.listeners.size;
    }
    get listeners():Set<T>{
        let value = new Set<T>();
        Object.defineProperty(this,'listeners',{value})
        return value;
    }
    constructor(owner=null){
        super();
        let signal:any = (...args)=>{
            signal.listeners.forEach(l=>l(...args))
        }
        Object.setPrototypeOf(signal,Signal.prototype)
        Object.defineProperty(signal,'owner',owner)
        return signal;
    }
    attach(listener:T):T{
        this.listeners.add(listener)
        return listener;
    }
    detach(listener:T):T{
        this.listeners.delete(listener);
        return listener;
    }
}
export function signal(target,property){
    let desc = Object.getOwnPropertyDescriptor(target,property);
    delete desc.value;
    delete desc.writable;
    desc.get = function(){
        let signal;
        Object.defineProperty(this,property,{
            configurable:true,
            writable:false,
            enumerable:false,
            value:signal = new Signal(this)
        })
        return signal;
    }
    desc.set = function(v){
        throw new TypeError('cannot assign value to signal field of object')
    }
    Object.defineProperty(target,property,desc);
}