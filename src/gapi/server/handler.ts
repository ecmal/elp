import {Exchange} from "./exchange";

export class Handler {
    protected options:any;
    constructor(options?:any){
        this.options = options||{};
    }
    async process(exchange:Exchange):Promise<any>{
        return exchange.reply();
    }
}