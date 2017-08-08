
import { HttpServerRequest, HttpServerResponse } from "./server";
import { Buffer } from "@ecmal/node/buffer";

export interface Url {
    protocol: "http:" | "https:";
    auth: string;
    host: string;
    port: string;
    hostname: string;
    hash: string;
    search: string;
    path: string;
    pathname: string;
    href: any;
    query: any;
    params : any;
}

export class Resource {
    readonly url: Url;
    readonly body: any;
    readonly request: HttpServerRequest;
    readonly response: HttpServerResponse;
    get headers(){
        return this.request.headers;
    }
}