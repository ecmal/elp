import { Buffer } from "../buffer";

export class Client {
    [Symbol.asyncIterator]():AsyncIterator<Buffer>{
        return null;
    }
    constructor(private url = 'https://github.com/Microsoft/TypeScript/pull/12346') { }
    read(){}
}