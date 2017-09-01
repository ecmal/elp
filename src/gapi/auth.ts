
import {Buffer} from "@ecmal/node/buffer";
import {GoogleApiBase} from "./base";
import {GoogleApiOptions} from "./api";

const Fs = require('fs');
const Crypto = require('crypto');
const process = require('process');
const KEYS: any = {};

const ENDPOINT = "https://www.googleapis.com/oauth2/v4/token";


export interface GoogleAuthSession {
    access_token?: string;
    expires_in: number;
    expires_at: number;
    token_type: string;
    scope:string[]
}

export class GoogleAuth {

    readonly session: GoogleAuthSession;
    get options(){
        return this.api.options;
    }
    constructor(readonly api: GoogleApiBase) {
        Object.defineProperty(this, 'session', {
            value: {
                token_type: 'Bearer',
                access_token: null,
                expires_in: 0
            }
        });
    }

    protected async meta(path = '/') {
        let req = this.api.request({
            protocol: "http:",
            method: "GET",
            host: "metadata.google.internal",
            path: `/computeMetadata/v1${path}?recursive=true`,
            headers: {
                "metadata-flavor": "Google",
                "user-agent": "ecaml-gcp/7.19.7",
                "accept": "application/json"
            }
        });
        try {
            let res = await req.send();
            return await res.json();
        } catch (ex) {
            ex.stack = `Metadata request failed : ${ex.stack}`;
            throw ex;
        }
    }
    public async authorize(headers?,  refresh?: boolean, scopes?: string[]) {
        let session = this.session;
        let remaining = 0;

        if (scopes) {
            this.options.scope = scopes;
        }
        if(typeof session.expires_at=='number'){
            remaining = Math.round((session.expires_at-Date.now())/1000);
        }
        session.expires_in = remaining;
        if (refresh || !session.expires_at || remaining<5) {
            session.access_token = null;
            session.scope = null;
        }
        if (typeof session.access_token != 'string' && detectKey(this.options)) {
            Object.assign(session, await this.tryGetJwtSession());
        }
        if (typeof session.access_token != 'string') {
            Object.assign(session, await this.tryGetCmdSession());
        }
        if (typeof session.access_token != 'string') {
            Object.assign(session, await this.tryGetGceSession());
        }
        if (this.session.access_token) {
            if(!this.session.scope){
                let req = this.api.request({
                    host: 'www.googleapis.com',
                    method: "POST",
                    path: `/oauth2/v2/tokeninfo?access_token=${this.session.access_token}`,
                });
                let res = await req.send();
                let info = await res.json();
                info.expires_at = Date.now()+info.expires_in*1000;
                Object.assign(session,info);
            }
            if(headers){
                headers.authorization = `${this.session.token_type} ${this.session.access_token}`
            }
        } else {
            throw new Error('All authentication mechanism failed')
        }
        return this.session;
    }

    protected async tryGetCmdSession() {
        try {
            let token = execute("gcloud auth application-default print-access-token");
            if (token) {
                if (!this.options.project) {
                    this.options.project = execute("gcloud config get-value project");
                }
            }
            return {
                access_token: token,
                expires_in: 3600,
                token_type: 'Bearer'
            }
        } catch (ex) {}
        return null;
    }

    protected async tryGetGceSession() {
        try {
            if (!this.options.project) {
                this.options.project = process.env.GCLOUD_PROJECT||void 0;
            }
            return await this.meta('/instance/service-accounts/default/token');
        } catch (ex) {}
        return null;
    }

    protected async tryGetJwtSession() {
        try {
            if (typeof this.options.key == 'object') {
                let req = this.api.request({
                    host: 'www.googleapis.com',
                    method: "POST",
                    path: "/oauth2/v4/token",
                });
                let res = await req.sendWwwForm({
                    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                    assertion: getAssertion(this.options)
                });
                return await res.json();
            }
        } catch (ex) {}
        return null;
    }
}

function execute(cmd) {
    return require('child_process').execSync(cmd, {
        encoding: 'utf8'
    }).replace(/[\r\n]/g, '');
}

function detectKey(options) {
    if (typeof options.key=='object') {
        return options.key
    }
    let file = options.key;
    if (file) {
        if (!Fs.existsSync(file)) {
            throw new Error(`Key file '${file}' specified in options not found`)
        }
    } else {
        file = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        if (file) {
            if (!Fs.existsSync(file)) {
                throw new Error(`Key file '${file}' specified in 'GOOGLE_APPLICATION_CREDENTIALS' env variable not found`)
            }
        }
    }
    if (file && KEYS.hasOwnProperty(file)) {
        return options.key=KEYS[file];
    } else
    if(file){
        let text = Fs.readFileSync(file, 'utf8').toString();
        let json = JSON.parse(text);
        if (!options.project) {
            options.project = json.project_id;
        }
        return options.key = KEYS[file] = json;
    }
}

function toBase64Url(input: any) {
    let data: any = input;
    if (typeof data == 'string') {
        data = new Buffer(input, 'utf8');
    }
    return data.toString('base64')
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
}

function getAssertion(options: any) {
    let key = detectKey(options);
    let scopes : string[] = options.scopes;
    let head = toBase64Url(JSON.stringify({alg: "RS256", typ: "JWT"}));
    let body = toBase64Url(JSON.stringify({
        iss: key.client_id,
        sub: key.user_email || key.client_email,
        scope: scopes.join(' '),
        aud: ENDPOINT,
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000)
    }));
    const sign = Crypto.createSign('RSA-SHA256');
    const payload = `${head}.${body}`;
    sign.write(payload);
    sign.end();
    return `${head}.${body}.${toBase64Url(sign.sign(key.private_key))}`;
}
