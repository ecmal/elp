import * as Url from "url";
import * as Https from "https";

export {Url};
export const Http = {
    async get(url): Promise<string> {
        function doGet(url){
            return new Promise<{ content: string, status: number, headers: any }>((a, r) => {
                let request = Https.get(url, (response) => {
                    let chunks = []
                    response.on('error', e => r(e));
                    response.on('data', (chunk) => chunks.push(chunk))
                    response.on('end', () => a({
                        status: response.statusCode,
                        headers: response.headers,
                        content: Buffer.concat(chunks).toString('utf8')
                    }));
                });
                request.on('error', e => r(e));
            })
        }
        return doGet(url).then(r => {
            if (r.headers.location) {
                return doGet(Url.resolve(url, r.headers.location));
            } else {
                return r;
            }
        }).then(r => r.content);
    }
}