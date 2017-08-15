//import { HttpServer } from "@ecmal/http/server/server";
//import "./resource/api/test";


import {Server} from "@ecmal/gapi/server";
import {OpenApiHandler} from "@ecmal/gapi/server/handlers/openapi";

import spec from "./openapi";

export async function main() {
    try {
        let server = new Server();

        server.use(new OpenApiHandler(spec));

        await server.listen(8080);

        console.info(`Server started on `);
        console.info(` * http://${server.settings.host}:${server.settings.port}`);
    } catch (ex) {
        console.error(ex);
    }
}