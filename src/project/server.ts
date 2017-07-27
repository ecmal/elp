import "@ecmal/runtime";


import * as React from "@ecmal/react/server";

import { HttpServer } from "@ecmal/http/server/server";

import { Route, GET, param } from "@ecmal/http/decors";
import { Result } from "@ecmal/http/server/result";
import { Resource } from "@ecmal/http/resource";
import { IndexPageComponent } from "./pages/index";


@Route('/api/v1/hello')
class ApiIndexResource {
    @GET
    index() {
        return {
            hello: 'World'
        }
    }
}

@Route('/app/v1/:path(*)')
class ScriptResource {
    private url: any;
    @GET
    index() {
        let parts = this.url.params.path.match(/^(.*)\.(js|map)$/);
        if (parts && parts.length == 3) {
            let ext = parts[2].toLowerCase();
            let mid = parts[1].toLowerCase().replace(/^(.*)\.js$/, '$1');
            switch (ext) {
                case 'js': return this.readJs(mid, this.url.query.bundle);
                case 'map': return this.readMap(mid);
            }
        } else {
            return Result.html(`<h1>Page not found<h1>`, Result.STATUS.NOT_FOUND.code)
        }
    }
    readJs(mid, bundle = null) {
        function getDependencies(id, deps = { '@ecmal/runtime': System }) {
            let m = System.read(id);
            if (!deps[m.id]) {
                deps[m.id] = m;
                if (Array.isArray(m.requires) && m.requires.length) {
                    m.requires.forEach(r => {
                        getDependencies(r, deps);
                    })
                }
            }
            return deps;
        }
        function getBundle(id, exec = true) {
            let map = getDependencies(id);
            if (!exec) {
                delete map['@ecmal/runtime'];
                delete map['@ecmal/runtime/index'];
            }
            let source = Object.keys(map).map(m => {
                return map[m].source
            }).join('\n');
            if (exec) {
                source = [
                    source,
                    `(function(){`,
                    `    var m = System.require("${id}")`,
                    `    if(typeof m.main == 'function'){`,
                    `        m.main();`,
                    `    }`,
                    `})()`,
                ].join('\n');
            }
            return source;
        }
        function getScript(mid) {
            return System.read(mid).source
        }
        let body;
        switch (bundle) {
            case "library": body = getBundle(mid,false); break;
            case "executable": body = getBundle(mid,true); break;
            default: body = getScript(mid); break;
        }
        return Result.raw(body, Result.STATUS.OK.code, {
            'Content-Type': 'application/javascript'
        })
    }
    readMap(mid) {
        return Result.raw(System.read(mid).map, Result.STATUS.OK.code, {
            'Content-Type': 'application/json'
        })
    }
}

@Route('/')
class AppIndexResource extends Resource {
    static ETAG = `"${Math.random().toString(16).substr(2)}"`;
    @GET
    index() {
        let enc = this.request.headers['accept-encoding'];
        let result = Result.html(
            React.renderToString(IndexPageComponent.get(Object.assign({
                title : 'Project',
                script : '@vendor/project/client',
                bundle : false
            },this.url.query))),
            Result.STATUS.OK.code
        );
        result.setHeader('ETag', AppIndexResource.ETAG);
        if (enc && enc.indexOf('gzip') >= 0) {
            result.setHeader('content-encoding', 'gzip')
        }
        return result;
    }
}

export async function main() {
    try {
        let server = new HttpServer();
        let address = await server.listen(8080);
        console.info(`Server started on ${address.host}:${address.port}`);
    } catch (ex) {
        console.error(ex);
    }
}