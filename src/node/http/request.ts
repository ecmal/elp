export class ServerRequest {
    constructor(protected value: any) {
        Object.defineProperty(this, 'value', {value,enumerable:false})
        Object.defineProperty(this, 'inspect', {
            value(){
                let that = {};
                for(let key in this){
                    that[key] = this[key];
                }
                return that;
            }
        })
    }
    get url():string{
        return this.value.url
    }
    set url(value:string){
        this.value.url = value;
    }
    get method():string{
        return this.value.method;
    }
    get path():string{
        return this.value.url;
    }
    get headers():any{
        return this.value.headers;
    }
    
}