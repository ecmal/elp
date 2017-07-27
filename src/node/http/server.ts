import { Slot, signal } from "@ecmal/runtime/decorators";
import { ServerRequest } from "./request";
import { ServerResponse } from "./response";
import { HTTP } from "./common";


export class Server {

    @signal onRequest: Slot<(req: ServerRequest, res: ServerResponse) => void>;

    protected value: any;
    constructor() {
        Object.defineProperty(this, 'value', { value: new HTTP.Server(), enumerable:false })
        Object.defineProperty(this.value, 'value', { value: this })
        this.value.on('request', (req, res) => {
            this.onRequest(new ServerRequest(req), new ServerResponse(res));
        });
    }
    async listen(port: number, host: string = '0.0.0.0') {
        return new Promise<{host:string,port:number}>((accept, reject) => {
            let onOk, onKo;
            this.value.on('listening', onOk = () => {
                this.value.removeListener('listening', onOk);
                this.value.removeListener('error', onKo);
                accept({ host, port });
            })
            this.value.on('error', onKo = (error) => {
                this.value.removeListener('listening', onOk);
                this.value.removeListener('error', onKo);
                reject(error);
            })
            this.value.listen(port, host);
        })
    }
    async close() {
        return new Promise<void>((accept, reject) => {
            let onOk, onKo;
            this.value.on('close', onOk = () => {
                this.value.removeListener('close', onOk);
                this.value.removeListener('error', onKo);
                accept();
            })
            this.value.on('error', onKo = (error) => {
                this.value.removeListener('close', onOk);
                this.value.removeListener('error', onKo);
                reject(error);
            })
            this.value.close();
        })
    }
}