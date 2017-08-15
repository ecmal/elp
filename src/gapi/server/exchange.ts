import {Server} from "./server";

export class Request {
    protected socket:any;
    public get url(){
        return this.socket.url;
    }
    public get method(){
        return this.socket.method;
    }
    constructor(socket:any){
        this.socket = socket;
    }
    public terminate(){}
}
export interface Status {
    code:number;
    message:string;
}
export class Response {

    readonly status:Status;

    constructor(socket:any){
        let status = {
            get code(){
                return socket.statusCode;
            },
            set code(v){
                socket.statusCode = v;
            },
            get message(){
                return socket.statusMessage
            },
            set message(v){
                socket.statusMessage = v;
            }
        };
        Object.defineProperties(this,{
            socket:{enumerable:false,configurable:false,value:socket},
            status:{enumerable:false,configurable:false,value:status},
        })
    }

    protected socket:any;

    public get done() {
        return this.socket.finished && this.socket.headersSent;
    }

    public getHeader(name:string):any{
        return this.socket.getHeader(name);
    }
    public setHeader(name:string,value:any){
        this.socket.setHeader(name,value);
    }
    public setHeaders(headers:object){
        for(let name in headers){
            this.setHeader(name,headers[name]);
        }
    }
    public write(content:any){
        console.info(content);
        this.socket.write(content)
    }
    public end(content?:any){
        if(content){
            this.write(content)
        }
        this.socket.end();
    }
    public setStatus(code:number,message?){
        this.socket.writeHead(code,message);
    }
    public terminate(){
        this.setStatus(500,'Request Terminated');
        this.end();
    }
}

export class Exchange {

    readonly server:Server;
    readonly request:Request;
    readonly response:Response;

    public get done():boolean {
        return this.response.done;
    }
    constructor(server:Server,request:Request,response:Response){
        this.server = server;
        this.request = request;
        this.response = response;
    }

    async reply(code:number=200,message:string='OK',headers?:any,content?:any){
        this.response.status.code=code;
        this.response.status.message=message;
        this.response.setHeaders(headers);
        this.response.end(content)
    }

    async terminate(){
        this.request.terminate();
        this.response.terminate();
    }
}