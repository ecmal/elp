import {Server} from './http';

export function main(){
    let server = new Server();
    let handler = server.onRequest.attach((req,res)=>{
        console.info(req)
        res.setHeader('content-type','application/json');
        res.setStatus(200,'OK');
        res.end(JSON.stringify({
            it:'works'
        }))
    })
    server.listen(8080);
}
