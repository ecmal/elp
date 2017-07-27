import { HttpServerResponse } from "./response";
import { HttpServerRequest } from "./request";
import { Url } from "@ecmal/runtime/utils/url";
import { MethodMirror } from "@ecmal/runtime/reflect";

export class HttpServerContext {
    protected route: any;
    protected resource: any = null;
    protected action: string = null;
    protected args: any[] = null;
    protected result:any = null;
    protected consumed: any = null;
    protected produced: any = null;
    protected mirror: MethodMirror = null;
    protected startedAt:Date = null;
    protected endAt: Date = null;
    constructor(
        readonly method: string,
        readonly url: any,
        readonly request: HttpServerRequest,
        readonly response: HttpServerResponse,
    ) {}
    onStart() { 
        this.startedAt = new Date();
    }
    onEnd() { 
        this.endAt = new Date();
    }
    onRoute(route: any) { 
        this.route = route;
    }
    onResource(resource: any, action: string, args: any[], mirror: MethodMirror) {
        this.resource = resource;
        this.action = action;
        this.args = args;
        this.mirror = mirror;
    }
    onConsume(body: any) {
        this.consumed = body;
    }
    onProduce(body: any) { 
        this.produced = body;
    }
    onExecute(body: any) { 
        this.result = body;
    }
    async execute(result) {
        return result;
    }
}