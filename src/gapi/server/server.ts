import {Handler} from "./handler";

export class Settings {
    [k:string]:any;
    port:number;
    host:string;
}

import { Slot, signal } from "@ecmal/runtime/decorators";
import {Exchange, Request, Response} from "./exchange";

const HTTP = require('http');

export class Server {
    @signal
    readonly onRequest: Slot<(exchange: Exchange) => void>;

    @signal
    readonly onResponse: Slot<(exchange: Exchange) => void>;

    @signal
    readonly onError: Slot<(exchange: Error) => void>;

    readonly settings:Settings;
    readonly handlers:Handler[];

    protected socket: any;

    constructor(settings?:Settings,handlers?:Handler[]) {
        this.settings = Object.assign({
            port:8080,
            host:"0.0.0.0"
        },settings);
        this.handlers = [];
        if(handlers && handlers.length){
            handlers.forEach(h=>this.use(h));
        }
        Object.defineProperty(this,'socket', {
            enumerable : false,
            value: new HTTP.Server()
        });
        Object.defineProperty(this.socket, 'value', {
            value: this
        });
        this.socket.on('request', (req, res) => {
            this.process(new Exchange(this,new Request(req),new Response(res)));
        });
    }
    public use(handler:Handler){
        if(this.handlers.indexOf(handler)<0){
            this.handlers.push(handler);
        }
        return this;
    }
    async listen(port: number, host: string = '0.0.0.0') {
        Object.assign(this.settings,{
            port : port || this.settings.port,
            host : host || this.settings.host
        });
        return new Promise<this>((accept, reject) => {
            let onOk, onKo;
            this.socket.on('listening', onOk = () => {
                this.socket.removeListener('listening', onOk);
                this.socket.removeListener('error', onKo);
                accept(this);
            });
            this.socket.on('error', onKo = (error) => {
                this.socket.removeListener('listening', onOk);
                this.socket.removeListener('error', onKo);
                this.onError(error);
                reject(error);
            });
            this.socket.listen(port, host);
        })
    }
    async close() {
        return new Promise<void>((accept, reject) => {
            let onOk, onKo;
            this.socket.on('close', onOk = () => {
                this.socket.removeListener('close', onOk);
                this.socket.removeListener('error', onKo);
                accept();
            });
            this.socket.on('error', onKo = (error) => {
                this.socket.removeListener('close', onOk);
                this.socket.removeListener('error', onKo);
                this.onError(error);
                reject(error);
            });
            this.socket.close();
        })
    }

    async process(exchange:Exchange){
        try{
            this.onRequest(exchange);
            for(let i=0;i<this.handlers.length;i++){
                let handler = this.handlers[i];
                await handler.process(exchange);
                if(exchange.done){
                    break;
                }
            }
            if(!exchange.done){
                await exchange.reply(404,'Not Found');
            }
            this.onResponse(exchange);
        }catch(ex){
            console.error(ex);
            this.onError(ex);
        }
    }
}
