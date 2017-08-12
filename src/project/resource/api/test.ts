
import { Route, GET } from "@ecmal/http/decors";
import { Resource } from "@ecmal/http/resource";
import { Result } from "@ecmal/http/server/result";
import { GoogleApi } from "@ecmal/gapi/api";

declare const process;


let gapi = new GoogleApi({
    scopes: [
        GoogleApi.SCOPES.LOGGING_ADMIN
    ]
});

@Route('/api/v1/session')
class SessionApiIndexResource {
    @GET
    async index() {
        return gapi.logging.auth.session;
    }
}

@Route('/api/v1/metadata')
class MetadataApiIndexResource {
    @GET
    async index() {
        return gapi.logging.auth.session;
    }
}

@Route('/api/v1/logs')
class LogsApiResource {
    @GET
    async index() {
        return gapi.logging.listProjectLogs()
    }
}