
import { HttpServerRequest, HttpServerResponse } from "./server";
import { Buffer } from "@ecmal/node/buffer";

export class Resource {
    readonly url: any;
    readonly body: any;
    readonly request: HttpServerRequest;
    readonly response: HttpServerResponse;
}