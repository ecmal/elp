export class ServerResponse {
    get status():number{
        return this.value.statusCode;
    }
    get headers():any{
        return this.value.headers;
    }
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
    setStatus(code:number,message?:string):this{
        this.value.statusCode = code || this.value.statusCode;
        this.value.statusMessage = message || this.value.statusMessage;
        return this;
    }
    setHeaders(headers:any):this{
        for(var name in headers){
            this.value.setHeader(name,headers[name]);
        }
        return this;
    }
    setHeader(name:string,value:any):this{
        this.value.setHeader(name,value);
        return this;
    }
    write(data:any){
        this.value.write(data);
        return this;
    }
    end(data?:any):this{
        if(data){
            this.write(data);
        }
        this.value.end();
        return this;
    }    
}