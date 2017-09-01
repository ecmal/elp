
import { Qs } from "@ecmal/node/querystring";
import { GoogleApiOptions } from "./api";
import { GoogleAuth } from "./auth";
import { Buffer } from "@ecmal/node/buffer";

let HTTP = require('http');
let HTTPS = require('https');
let STREAM = require('stream');

export interface GoogleRequest {
    protocol?: "http:" | "https:";
    host?: string;
    method?: string;
    path?: string;
    headers?: { [key: string]: any };
    timeout?: number;
    query?: any;
    body?: any;
    file?: string;
    media?: {
        contentType?: string;
        contentSize?: number;
        contentBody?: Buffer;
    };
}
export class GoogleApiResponse {
    get headers(){
        return this.socket.headers;
    }

    constructor(
        readonly request:GoogleApiRequest,
        private socket:any
    ){}

    async data():Promise<Buffer>{
        return new Promise<Buffer>((accept,reject)=>{
            let chunks:Buffer[] = [];
            this.socket.on('data',chunk=>chunks.push(chunk));
            this.socket.on('error',error=>reject(error));
            this.socket.on('end',()=>{
                accept(Buffer.concat(chunks));
            })
        })
    }
    async text(): Promise<any> {
        return (await this.data()).toString('utf8')
    }
    async json(): Promise<any> {
        let json = {};
        let text = await this.text();
        if (text && text.length) {
            try{
                json = JSON.parse(text);
            }catch(ex){
                ex.message = `${ex.message}\n${text}`;
                throw ex;
            }
        }
        return json;
    }
}
export class GoogleApiRequest {
    private transport:any;
    private socket:any;
    private agent:any;

    readonly response:GoogleApiResponse;
    constructor(
        protected options: GoogleRequest,
        protected api: GoogleApiBase
    ) { }

    get method() {
        return this.options.method;
    }
    get protocol() {
        return this.options.protocol || 'https:';
    }
    get headers() {
        if (!this.options.headers) {
            this.options.headers = {};
        }
        return this.options.headers;
    }

    public setHeader(key: string, value: any) {
        this.headers[key] = value;
    }

    public getHeader(key: string): any {
        return this.headers[key];
    }

    async send(text?:any): Promise<GoogleApiResponse> {
        this.agent = this.api.getAgent(this.protocol);
        switch (this.protocol) {
            case 'http:': {
                this.transport = require('http');
                break;
            }
            case 'https:': {
                this.transport = require('https');
                break;
            }
        }

        return new Promise<GoogleApiResponse>((accept,reject)=>{
            let options = Object.assign({agent:this.agent},this.options);
            if(options.query){
                options.path = `${options.path}?${Qs.encode(options.query)}`
            }
            if(text && !isStream(text) && !Buffer.isBuffer(text) && typeof text != 'string'){
                if(!options.headers['content-type']){
                    options.headers['content-type'] = 'application/json'
                }
                text = JSON.stringify(text)
            }
            this.socket = this.transport.request(options,res=>{
                accept(new GoogleApiResponse(this,res));
            })
            this.socket.on('error',error=>reject(error));
            if(text){
                if(isStream(text)){
                    text.pipe(this.socket);
                }else{
                    this.socket.end(text)
                }
            }else{
                this.socket.end()
            }
        })
    }

    async sendWwwForm(data: object) {
        this.setHeader("content-type", "application/x-www-form-urlencoded");
        this.setHeader("cache-control", "no-cache");
        return this.send(`${Qs.encode(data)}\n`);
    }
}

export class GoogleApiError extends Error {
    readonly code: number;
    readonly message: string;
    readonly errors: any[];
    constructor(error: {
        component:string,
        code: number,
        message: string,
        errors: any[]
    }) {
        error.message = `${error.code ? error.code + ': ' : ''}${error.message}`;
        if (Array.isArray(error.errors)) {
            error.message = `${error.message}\n${error.errors.map(e => e.message).join('\n')}`
        }
        super(error.message);
        Object.assign(this, error);
    }
}

export class GoogleApiBase {

    readonly auth: GoogleAuth;

    protected httpAgent;
    protected httpsAgent;

    /**
     * Create google api base client
     * @param options Google Api options and http agent settings
     */
    constructor(readonly options: GoogleApiOptions) {
        console.info(new.target.name,"Created");
        Object.defineProperties(this, {
            auth: { value: new GoogleAuth(this) },
        });
    }

    /**
     * Return instance of http client agent based on provided protocol
     * @param protocol 
     */
    public getAgent(protocol: 'http:' | 'https:') {
        switch (protocol) {
            case 'http:': {
                if (!this.httpAgent) {
                    if (this.options.agent) {
                        this.httpAgent = new HTTP.Agent(this.options.agent);
                    } else {
                        this.httpAgent = HTTP.globalAgent;
                    }
                }
                return this.httpAgent;
            }
            case 'https:': {
                if (!this.httpsAgent) {
                    if (this.options.agent) {
                        this.httpsAgent = new HTTPS.Agent(this.options.agent);
                    } else {
                        this.httpsAgent = HTTPS.globalAgent;
                    }
                }
                return this.httpsAgent;
            }
            default: throw new Error(`invalid protocol '${protocol}'`)
        }
    }

    /**
     * Create api request object and return without sending it 
     * @param options 
     */
    public request(options: GoogleRequest) {
        return new GoogleApiRequest(options, this);
    }

    /**
     * Create api request send it and return api response in asyncronus way 
     * @param options 
     */
    public async call(options: GoogleRequest) {
        function multipart(parts: any[]) {
            let boundry = Date.now().toString(32) + '' + String(Math.random()).substring(2);
            let media = {
                contentType: `multipart/related; boundary=${boundry}`,
                contentSize: 0,
                contentBody: null
            };
            parts = parts.map(part => {
                if (Buffer.isBuffer(part.contentBody)) {
                    part.contentType = part.contentType || 'application/octet-stream';
                } else
                    if (typeof part.contentBody == 'object') {
                        part.contentType = part.contentType || 'application/json';
                        part.contentBody = new Buffer(JSON.stringify(part.contentBody, null, 2));
                    } else {
                        part.contentType = part.contentType || 'text/plain';
                        part.contentBody = new Buffer(String(part.contentBody))
                    }
                part.contentSize = part.contentBody.length;
                let headers = new Buffer([
                    `--${boundry}`,
                    `content-type: ${part.contentType}`,
                    //`content-length: ${part.contentSize}`,
                    '', ''
                ].join('\r\n'));

                let contents = [headers, part.contentBody, new Buffer('\r\n')];
                return Buffer.concat(contents)
            });
            parts.push(new Buffer(`--${boundry}--`))
            media.contentBody = Buffer.concat(parts);
            media.contentSize = media.contentBody.length;
            return media;
        }
        let body: Buffer = options.body;
        let type: string = void 0;

        if (options.media) {
            //refresh for media
            //console.info("refresh for media")
            //await this.auth.refresh();
            if (options.body) {
                body = options.body;
                delete options.body;
                options.media = multipart([
                    { contentBody: body },
                    options.media
                ])
            }
            type = options.media.contentType;
            body = options.media.contentBody;
            delete options.media;
        }

        // if (options.body) {
        //     body = options.body;
        //     if (Buffer.isBuffer(body)) {
        //         type = type || 'application/octet-stream';
        //     } else
        //     if (typeof body == 'object') {
        //         type = type || 'application/json';
        //         body = new Buffer(JSON.stringify(body, null, 2));
        //     } else {
        //         type = type || 'text/plain';
        //         body = new Buffer(String(body))
        //     }
        // }

        if (!options.headers) {
            options.headers = {}
        }
        //console.info(options)
       // if (body) {
            //console.info('======= BODY ====== {')
            //console.info(body.toString('utf8'));
            //console.info('======= BODY ====== }')
            //options.headers['content-type'] = type;
            //options.headers['content-size'] = body.length;
        //}

        let sendRequest = async () => {
            let req = this.request(options);
            let res = await req.send(body);
            let obj = await res.json();
            //console.info(res.statusCode,res.statusMessage,obj);
            if (obj.error) {
                obj.error.component = this.constructor.name;
                Object.assign(obj.error,options);
                throw new GoogleApiError(obj.error);
            } else {
                return obj;
            }
        };
        let result = null;
        try {
            await this.auth.authorize(options.headers);
            result = await sendRequest();
        } catch (ex) {
            if (ex.code == 401 || ex.code == 403) {
                await this.auth.authorize(options.headers,true);
                result = await sendRequest();
            } else {
                throw ex;
            }
        }
        return result;
    }

}

function isStream (obj) {
    return obj instanceof STREAM.Stream &&
    typeof (obj as any)._read === 'function' &&
    typeof (obj as any)._readableState === 'object';
}