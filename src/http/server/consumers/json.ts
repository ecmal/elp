import { HttpConsumer } from "./consumer";
import { Buffer } from "@ecmal/node/buffer";

export class HttpJsonConsumer extends HttpConsumer {
    static CONTENT_TYPE: string = "application/json;charset=utf-8";
    async consume() {
        return new Promise((accept, reject) => {
            let size = 0, type =HttpJsonConsumer.CONTENT_TYPE, data: Buffer,  body: any, chunks: Buffer[] = [];
            this.request.on('data', (chunk) => {
                chunks.push(chunk);
            })
            this.request.on('end', () => {
                try{
                    if (chunks.length>0){
                        data = Buffer.concat(chunks)
                        size = data.length;
                        body = JSON.parse(data.toString('utf8'));
                    }
                    accept({size,type,data,body})
                } catch (error){
                    reject(error)
                }
            })
            this.request.on('error',(error)=>reject(error))
        })
    }
}