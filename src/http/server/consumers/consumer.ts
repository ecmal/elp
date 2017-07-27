import { HttpServerRequest } from "../request";
import { HttpServerResponse } from "../response";
import { Buffer } from "@ecmal/node/buffer";

export class HttpConsumer {

    constructor(
        protected request: HttpServerRequest,
        protected response: HttpServerResponse,
        protected resource: any
    ) { }
    
    async consume(){
       return null;
    }
}