import { Route,GET } from "@ecmal/http/decors";
import { Resource } from "@ecmal/http/resource";
import { Result } from "@ecmal/http/server/result";

@Route('/app/v1/:path(*)')
class ScriptResource extends Resource {
    get isGzipAccepted(){
        let enc = this.request.headers['accept-encoding'];
        return enc && enc.indexOf('gzip') >= 0;
    }
    gzip(result){
        if (this.isGzipAccepted) {
            result.setHeader('content-encoding', 'gzip')
        }
        return result;
    }
    @GET
    index() {
        let res;
        let parts = this.url.params.path.match(/^(.*)\.(js|map)$/);
        if (parts && parts.length == 3) {
            let ext = parts[2].toLowerCase();
            let mid = parts[1].toLowerCase().replace(/^(.*)\.js$/, '$1');

            switch (ext) {
                case 'js'  : res = this.readJs(mid, this.url.query.bundle);break;
                case 'map' : res = this.readMap(mid);break;
            }
        } else {
            res = Result.html(`<h1>Page not found<h1>`, Result.STATUS.NOT_FOUND.code)
        }
        return this.gzip(res);
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