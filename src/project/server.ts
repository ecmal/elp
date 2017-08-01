import system from "@ecmal/runtime";
import * as React from "@ecmal/react/server";
import { HttpServer } from "@ecmal/http/server/server";

import "./resource/api/test";

export async function main() {
    try {
        let server = new HttpServer();
        let address = await server.listen(8080);
        console.info(`Server started on ${address.host}:${address.port}`);
    } catch (ex) {
        console.error(ex);
    }
}