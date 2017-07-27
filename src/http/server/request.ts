import { Server, ServerRequest, ServerResponse } from "@ecmal/node/http"
export class HttpServerRequest extends ServerRequest{
    on(event:string,handler:Function){
        this.value.on(event,handler);
    }
}
