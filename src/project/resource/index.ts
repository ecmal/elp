import * as React from "@ecmal/react/server";

import { Route,GET } from "@ecmal/http/decors";
import { Resource } from "@ecmal/http/resource";
import { Result } from "@ecmal/http/server/result";
import { IndexPageComponent } from "../pages/index";

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