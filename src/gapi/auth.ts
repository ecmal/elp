import Fs from "@ecmal/node/fs";
import { Qs } from "@ecmal/node/querystring";
import { Buffer } from "@ecmal/node/buffer";
import { GoogleApiBase } from "./base";
import { GoogleApiOptions } from "./api";

const Crypto = require('crypto');
const process = require('process');

const CONFIG = {
    AUTH_ENDPOINT: "https://www.googleapis.com/oauth2/v4/token"
};

export interface GoogleAuthSession {
    access_token?: string;
    expires_in: number;
    token_type: string;
}

export class GoogleAuth {
    private keyPath;
    private keyJson;
    readonly options: GoogleApiOptions;
    readonly session: GoogleAuthSession;
    public get header() {
        return `${this.session.token_type} ${this.session.access_token}`
    }
    constructor(readonly api: GoogleApiBase) {
        Object.defineProperty(this, 'options', {
            value: api.options
        });
        Object.defineProperty(this, 'session', {
            value: {
                token_type: 'Bearer',
                access_token: '',
                expires_in: 0
            }
        });
        if(this.getKeyPath()){
            this.getKeyJson();
        }
    }
    protected getKeyPath(reload=false) {
        let file = reload ? null : this.keyPath;
        if(file){
            return file;
        }
        file = this.options.keyFile;
        if (file && Fs.existsSync(file)) {
            return this.keyPath=file;
        } else 
        if(this.options.keyFile){
            console.info(`Options Key File Not Found ${file || ''}`);
        }
        file = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        if (file && Fs.existsSync(file)) {
            return this.keyPath=file;
        } else {
            console.info(`Env Key File Not Found ${file || ''}`);
        }
    }
    protected getKeyJson() {
        if(this.keyJson){
            return this.keyJson;
        }
        let text = Fs.readFileSync(this.getKeyPath(), 'utf8').toString();
        let json = JSON.parse(text);
        if (!this.options.project) {
            this.options.project = json.project_id;
        }
        return this.keyJson=json;
    }
    protected static toBase64Url(input: any) {
        let data: any = input;
        if (typeof data == 'string') {
            data = new Buffer(input, 'utf8');
        }
        return data.toString('base64')
            .replace(/=/g, "")
            .replace(/\+/g, "-")
            .replace(/\//g, "_");
    }
    protected getAssertion(scopes: string[]) {
        let key = this.getKeyJson();
        let head = GoogleAuth.toBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }))
        let body = GoogleAuth.toBase64Url(JSON.stringify({
            iss: key.client_id,
            sub: key.user_email || key.client_email,
            scope: scopes.join(' '),
            aud: CONFIG.AUTH_ENDPOINT,
            exp: Math.floor(Date.now() / 1000) + 3600,
            iat: Math.floor(Date.now() / 1000)
        }));
        const sign = Crypto.createSign('RSA-SHA256');
        const payload = `${head}.${body}`;
        sign.write(payload);
        sign.end();
        return `${head}.${body}.${GoogleAuth.toBase64Url(sign.sign(key.private_key))}`;
    }
    public async getSession(cached = true): Promise<GoogleAuthSession> {
        let session = this.session;
        if (!cached) {
            session.access_token = null;
        }
        if (session && session.access_token) {
            return this.session;
        } else {
            let scopes: string[] = this.options.scopes;
            session = await this.tryGetJwtSession(scopes);
            if (session) {
                Object.assign(this.session, session);
                return this.session
            } else {
                console.info('JWT Auth Failed')
            }
            session = await this.tryGetGceSession(scopes);
            if (session) {
                console.info("UPDATE",session);
                return Object.assign(this.session, session);
            } else {
                console.info('GCE Auth Failed')
            }
        }
        return session || null;
    }
    public async getMeta(version = 'v1', path = '', query = {}) {
        let search = Qs.encode(Object.assign({ recursive: true }, query));
        let req = this.api.request({
            protocol: "http:",
            method: "GET",
            host: "metadata.google.internal",
            path: `/computeMetadata/${version}/${path}?${search}`,
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
    public async refresh() {
        this.session.access_token = null;
        await this.getSession();
        return this.header;
    }
    protected async tryGetGceSession(scopes) {
        try {
            return await this.getMeta('v1', 'instance/service-accounts/default/token');
        } catch (ex) {
            console.info(ex.message);
            return false;
        }
    }
    protected async tryGetJwtSession(scopes) {
        try {
            let fileName = this.getKeyPath();
            if (Fs.existsSync(fileName)) {
                let req = this.api.request({
                    host: 'www.googleapis.com',
                    method: "POST",
                    path: "/oauth2/v4/token",
                });
                let res = await req.sendWwwForm({
                    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                    assertion: this.getAssertion(scopes)
                });
                return await res.json();
            } else {
                return false;
            }
        } catch (ex) {
            console.info(ex.stack || ex.message);
            return false;
        }
    }
}
