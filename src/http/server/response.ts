import { Server, ServerRequest, ServerResponse } from "@ecmal/node/http"
export class HttpServerResponse extends ServerResponse {
    get finished():boolean {
        return this.value.finished
    }
    set finished(value:boolean){
        this.value.finished = value;
    }
    on(event:string,handler:Function){
        this.value.on(event,handler);
    }
    end(data:any,callback?:Function){
        return this.value.end(data,callback);
    }
}
