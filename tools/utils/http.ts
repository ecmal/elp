import {url,http,https} from "./node";


export const Http = {
    async get(u): Promise<string> {
        function doGet(u){
            u = url.parse(u);
            let client = u.protocol=='https:'?https:http;
            return new Promise<{ content: string, status: number, headers: any }>((a, r) => {
                let request = client.get(u, (response) => {
                    let chunks = [];
                    response.on('error', e => r(e));
                    response.on('data', (chunk) => chunks.push(chunk));
                    response.on('end', () => a({
                        status: response.statusCode,
                        headers: response.headers,
                        content: Buffer.concat(chunks).toString('utf8')
                    }));
                });
                request.on('error', e => r(e));
            })
        }
        return doGet(u).then(r => {
            if (r.headers.location) {
                return doGet(u.resolve(u, r.headers.location));
            } else {
                return r;
            }
        }).then(r => r.content);
    }
};