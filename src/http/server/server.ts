import { Url } from "@ecmal/runtime/utils/url"
import { Buffer } from "@ecmal/node/buffer"
import { Server, ServerRequest, ServerResponse } from "@ecmal/node/http"
import { bound, cached, Slot, signal } from "@ecmal/runtime/decorators";
import { Router, Route, Match } from "../router";
import { HttpJsonConsumer } from "./consumers/json";

import { HttpProducer } from "./producers/producer";
import { HttpJsonProcuder } from "./producers/json";
import { HttpConsumer } from "./consumers/consumer";
import { HttpServerContext } from "./context";
import { Resource } from "../resource";
import { Result } from "./result";
import { HttpServerRequest } from "./request";
import { HttpServerResponse } from "./response";


export class HttpRoute extends Route {
    static router = new Router<HttpRoute>(HttpRoute);
    static match(path: string): Match<HttpRoute> {
        return this.router.match(path);
    }
    static define(path: string) {
        return this.router.define(path);
    }
    public addResource(method: string, controller: { new(): Resource }, action: string) {
        console.info(method, this.pattern, controller.name, action)
    }
}



export class HttpServer extends Server {
    readonly base: string;
    constructor() {
        super();
        this.onRequest.attach(async (request, response) => {
            Object.setPrototypeOf(request,HttpServerRequest.prototype)
            Object.setPrototypeOf(response,HttpServerResponse.prototype)
            try {
                await this.process(request as HttpServerRequest, response as HttpServerResponse);
            } catch (ex) {
                response.setStatus(500, ex.message);
                response.setHeader('content-type','text/plain');
                response.end(ex.stack || ex.message);
            }
        });
    }
    protected getUrl(request: any) {
        let path = request.url.replace(/\/+/g, '/');
        let head = request.headers;
        let url = Url.parse(path, true);
        url.protocol = `${head['x-forwarded-proto'] || 'http'}:`;
        url.host = `${head.host || head['x-forwarded-for'] || this.value.address().address}`;
        url = Url.parse(Url.format(url), true)
        request.url = url.href;
        return url;
    }
    protected getProducer(request: HttpServerRequest, response: HttpServerResponse, resource: any): HttpProducer {
        return new HttpJsonProcuder(request, response, resource);
    }
    protected getConsumer(request: HttpServerRequest, response: HttpServerResponse, resource: any): HttpConsumer {
        return new HttpJsonConsumer(request, response, resource);
    }
    protected getContext(method: string, url: any, request: HttpServerRequest, response: HttpServerResponse): HttpServerContext {
        return new HttpServerContext(method, url, request, response)
    }
    protected async process(request: HttpServerRequest, response: HttpServerResponse) {

        let method = request.method.toUpperCase();
        let url = this.getUrl(request);
        let context = this.getContext(method, url, request, response);
        context.onStart();
        let route = await this.route(context);
        if (route) {
            context.onRoute(route);
        }
        let producer = this.getProducer(request, response, route);
        let consumer = this.getConsumer(request, response, route);
        let result = null;
        try {
            if (route) {
                let resource = route[method];
                if (resource) {
                    let body = await consumer.consume()
                    context.onConsume(body);
                    result = await resource.action(
                        url, body.body, request, response,
                        (resource, action, args, mirror) => {
                            context.onResource(resource, action, args, mirror)
                        }
                    );
                } else {
                    throw new Error(`Method "${method}" not implemented for "${url.pathname}"`)
                }
            }
            result = (await context.execute(result)) || result;
        } catch (ex) {
            result = ex;
        }

        context.onExecute(result)
        if (result instanceof Result) {
            context.onProduce(await result.write(response));
        } else {
            context.onProduce(await producer.produce(result));
        }
        context.onEnd();
    }

    protected async route(context: HttpServerContext) {
        let match = HttpRoute.match(context.url.pathname);
        if (match) {
            context.url.params = match.params;
        }
        return match && match.node && match.node.data;
    }
}