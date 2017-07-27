import { HttpProducer } from "./producer";
import { Buffer } from "@ecmal/node/buffer";

export class HttpJsonProcuder extends HttpProducer {
    static CONTENT_TYPE: string = "application/json;charset=utf-8";
    async write(status: number, message: string, body: any): Promise<{ size: number, type: string, body?: any, data?: Buffer }> {
        return new Promise<{ size: number, type: string, body?: any, data?: Buffer }>((accept, reject) => {
            try {
                let data = Buffer.from(JSON.stringify(body));
                let size = data.length;
                let type = HttpJsonProcuder.CONTENT_TYPE;
                this.response.setHeader('content-type', type);
                this.response.setHeader('context-length', `${size}`)
                this.response.setStatus(status, message)
                this.response.end(data, (err) =>
                    err ? reject(err) : accept({
                        size, type, body, data
                    })
                );
            } catch (ex) {
                reject(ex);
            }
        })
    }
    async writeNotFound() {
        return await this.write(404, "Not Found", {
            status: 404,
            message: 'Not Found'
        })
    }
    async writeError(e: Error) {
        let status = (typeof e['status'] == 'number' && e['status'] >= 100) ? e['status'] : 200;
        let message = (typeof e['message'] == 'string') ? e['message'] : 'OK';
        let stack = e['stack'] && e['stack'].split('\n');
        return await this.write(status, message, { status, message, stack })
    }
    async writeObject(o: any) {
        let status = (typeof o.status == 'number' && o.status >= 100) ? o.status : 200;
        let message = (typeof o.message == 'string') ? o.message : 'OK';
        return await this.write(status, message, o);
    }
    async produce(result: any) {
        if (this.response.finished) {
            return result;
        } else {
            if (result === null) {
                return await this.writeNotFound()
            } else
            if (result instanceof Error) {
                return await this.writeError(result);
            } else {
                return await this.writeObject(result);
            }
        }
    }
}