import { HttpServerRequest } from "../request";
import { HttpServerResponse } from "../response";

export class HttpProducer {
    constructor(
        protected request: HttpServerRequest,
        protected response: HttpServerResponse,
        protected resource: any
    ) { }
    produce(result: any) { }
}