
import { Buffer } from "@ecmal/node/buffer";
export const Status = {
    CONTINUE                             : { "code": 100, "message": "Continue" },
    SWITCHING_PROTOCOLS                  : { "code": 101, "message": "Switching Protocols" },
    PROCESSING                           : { "code": 102, "message": "Processing" },
    OK                                   : { "code": 200, "message": "OK" },
    CREATED                              : { "code": 201, "message": "Created" },
    ACCEPTED                             : { "code": 202, "message": "Accepted" },
    NONAUTHORITATIVE_INFORMATION         : { "code": 203, "message": "Non-Authoritative Information" },
    NO_CONTENT                           : { "code": 204, "message": "No Content" },
    RESET_CONTENT                        : { "code": 205, "message": "Reset Content" },
    PARTIAL_CONTENT                      : { "code": 206, "message": "Partial Content" },
    MULTI_STATUS                         : { "code": 207, "message": "Multi-Status" },
    ALREADY_REPORTED                     : { "code": 208, "message": "Already Reported" },
    IM_USED                              : { "code": 226, "message": "IM Used" },
    MULTIPLE_CHOICES                     : { "code": 300, "message": "Multiple Choices" },
    MOVED_PERMANENTLY                    : { "code": 301, "message": "Moved Permanently" },
    FOUND                                : { "code": 302, "message": "Found" },
    SEE_OTHER                            : { "code": 303, "message": "See Other" },
    NOT_MODIFIED                         : { "code": 304, "message": "Not Modified" },
    USE_PROXY                            : { "code": 305, "message": "Use Proxy" },
    TEMPORARY_REDIRECT                   : { "code": 307, "message": "Temporary Redirect" },
    PERMANENT_REDIRECT                   : { "code": 308, "message": "Permanent Redirect" },
    BAD_REQUEST                          : { "code": 400, "message": "Bad Request" },
    UNAUTHORIZED                         : { "code": 401, "message": "Unauthorized" },
    PAYMENT_REQUIRED                     : { "code": 402, "message": "Payment Required" },
    FORBIDDEN                            : { "code": 403, "message": "Forbidden" },
    NOT_FOUND                            : { "code": 404, "message": "Not Found" },
    METHOD_NOT_ALLOWED                   : { "code": 405, "message": "Method Not Allowed" },
    NOT_ACCEPTABLE                       : { "code": 406, "message": "Not Acceptable" },
    PROXY_AUTHENTICATION_REQUIRED        : { "code": 407, "message": "Proxy Authentication Required" },
    REQUEST_TIMEOUT                      : { "code": 408, "message": "Request Timeout" },
    CONFLICT                             : { "code": 409, "message": "Conflict" },
    GONE                                 : { "code": 410, "message": "Gone" },
    LENGTH_REQUIRED                      : { "code": 411, "message": "Length Required" },
    PRECONDITION_FAILED                  : { "code": 412, "message": "Precondition Failed" },
    PAYLOAD_TOO_LARGE                    : { "code": 413, "message": "Payload Too Large" },
    URI_TOO_LONG                         : { "code": 414, "message": "URI Too Long" },
    UNSUPPORTED_MEDIA_TYPE               : { "code": 415, "message": "Unsupported Media Type" },
    RANGE_NOT_SATISFIABLE                : { "code": 416, "message": "Range Not Satisfiable" },
    EXPECTATION_FAILED                   : { "code": 417, "message": "Expectation Failed" },
    IM_A_TEAPOT                          : { "code": 418, "message": "I'm a teapot" },
    MISDIRECTED_REQUEST                  : { "code": 421, "message": "Misdirected Request" },
    UNPROCESSABLE_ENTITY                 : { "code": 422, "message": "Unprocessable Entity" },
    LOCKED                               : { "code": 423, "message": "Locked" },
    FAILED_DEPENDENCY                    : { "code": 424, "message": "Failed Dependency" },
    UNORDERED_COLLECTION                 : { "code": 425, "message": "Unordered Collection" },
    UPGRADE_REQUIRED                     : { "code": 426, "message": "Upgrade Required" },
    PRECONDITION_REQUIRED                : { "code": 428, "message": "Precondition Required" },
    TOO_MANY_REQUESTS                    : { "code": 429, "message": "Too Many Requests" },
    REQUEST_HEADER_FIELDS_TOO_LARGE      : { "code": 431, "message": "Request Header Fields Too Large" },
    UNAVAILABLE_FOR_LEGAL_REASONS        : { "code": 451, "message": "Unavailable For Legal Reasons" },
    INTERNAL_SERVER_ERROR                : { "code": 500, "message": "Internal Server Error" },
    NOT_IMPLEMENTED                      : { "code": 501, "message": "Not Implemented" },
    BAD_GATEWAY                          : { "code": 502, "message": "Bad Gateway" },
    SERVICE_UNAVAILABLE                  : { "code": 503, "message": "Service Unavailable" },
    GATEWAY_TIMEOUT                      : { "code": 504, "message": "Gateway Timeout" },
    HTTP_VERSION_NOT_SUPPORTED           : { "code": 505, "message": "HTTP Version Not Supported" },
    VARIANT_ALSO_NEGOTIATES              : { "code": 506, "message": "Variant Also Negotiates" },
    INSUFFICIENT_STORAGE                 : { "code": 507, "message": "Insufficient Storage" },
    LOOP_DETECTED                        : { "code": 508, "message": "Loop Detected" },
    BANDWIDTH_LIMIT_EXCEEDED             : { "code": 509, "message": "Bandwidth Limit Exceeded" },
    NOT_EXTENDED                         : { "code": 510, "message": "Not Extended" },
    NETWORK_AUTHENTICATION_REQUIRED      : { "code": 511, "message": "Network Authentication Required" }
};

export class Result {
    static STATUS = Status;

    static raw(body: string|Buffer, status: number = Status.OK.code, headers?: any): Result {
        return new Result(status, body, headers);
    }
    static js(body: string|Buffer, status: number = Status.OK.code, headers?: any): Result {
        return new Result(status, body, headers).setHeader('content-type', 'application/javascript; charset=utf-8');
    }
    static html(body: string, status: number = Status.OK.code, headers?: any): Result {
        return this.raw(body, status, headers).setHeader('content-type', 'text/html; charset=utf-8');
    }
    static json(body: string, status: number = Status.OK.code, headers?: any): Result {
        return this.raw(body, status, headers).setHeader('content-type', 'application/json; charset=utf-8');
    }
    static xml(body: string, status: number = Status.OK.code, headers?: any): Result {
        return this.raw(body, status, headers).setHeader('content-type', 'application/xml; charset=utf-8');
    }

    public size: number;
    public type: string;
    public body: any;
    public data: Buffer;
    public headers: any;
    public status: number;

    constructor(status: number, body: any = null, headers: any = {}) {
        this.headers = {};
        this.status = status;
        this.headers = headers;
        this.body = body;
        this.setBody(body);
        for (let name in headers) {
            this.setHeader(name, headers[name]);
        }
    }
    getHeader(name: string): any {
        name = String(name).toLowerCase().trim();
        return this.headers[name];
    }
    setHeader(name: string, value: any): this {
        name = String(name).toLowerCase().trim();
        this.headers[name] = value;
        if (name == 'content-type') {
            this.type = value.toLowerCase();
        }
        return this;
    }
    setBody(body: any): this {
        let type = this.headers['content-type']||'application/octet-stream';
        if (body == null) {
            this.data = new Buffer(0);
        }
        if (typeof body == 'object') {
            type = 'application/json; charset=utf-8';
            body = JSON.stringify(body);
        }
        if (typeof body == 'string') {
            type = 'text/plain; charset=utf-8';
            body = Buffer.from(body);
        }
        
        if (Buffer.isBuffer(body)) {
            
            this.data = body;
        } else {
            throw new Error('Invalid body type')
        }
        this.type = this.type || type;
        this.size = this.data.length;
        
        return this;
    }
    async write(response) {
        return new Promise<Result>((accept, reject) => {
            try {
                for (var h in this.headers) {
                    response.setHeader(h, this.headers[h]);
                }
                response.setStatus(this.status);
                if(this.headers['content-encoding']=='gzip'){
                    let zlib = require('zlib');
                    const gzip = zlib.createGzip();
                    gzip.on('data',c=>{
                        response.write(c)
                    })
                    gzip.on('end',c=>{
                        response.end(c)
                    })
                    gzip.end(this.data, (err) =>
                        err ? reject(err) : accept(this)
                    );
                }else{
                    response.end(this.data, (err) =>
                        err ? reject(err) : accept(this)
                    );
                }
                
            } catch (ex) {
                reject(ex);
            }
        })
    }
}