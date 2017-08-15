import { cached } from "@ecmal/runtime/decorators";

import { GoogleLogging } from "./logging/api";
import { GoogleDatastore } from "./datastore/api";
import { GoogleBigquery } from "./bigquery/api";
import { GooglePubsub } from "./pubsub/api";
import { GoogleTracing } from "./trace/api";

export interface GoogleApiOptions {
    key?: string|object;
    scope?: string[];
    project?: string;
    agent?: {
        keepAlive?: boolean;
        keepAliveMsecs?: number;
        maxSockets?: number;
        maxFreeSockets?: number;
    }
}

const api:any = {};
export const Scopes = {
    CLOUD: "https://www.googleapis.com/auth/cloud-platform",
    CLOUD_READONLY: "https://www.googleapis.com/auth/cloud-platform.read-only",
    LOGGING_ADMIN: "https://www.googleapis.com/auth/logging.admin",
    LOGGING_READ: "https://www.googleapis.com/auth/logging.read",
    LOGGING_WRITE: "https://www.googleapis.com/auth/logging.write",
    DATASTORE: "https://www.googleapis.com/auth/datastore",
    PUBSUB: "https://www.googleapis.com/auth/pubsub",
    BIGQUERY: "https://www.googleapis.com/auth/bigquery",
    BIGQUERY_INSERTDATA: "https://www.googleapis.com/auth/bigquery.insertdata",
    TASKQUEUE: "https://www.googleapis.com/auth/taskqueue",
    TASKQUEUE_CONSUMER: "https://www.googleapis.com/auth/taskqueue.consumer",
    TASKQUEUE_CLOUD: "https://www.googleapis.com/auth/cloud-taskqueue",
    TASKQUEUE_CLOUD_CONSUMER: "https://www.googleapis.com/auth/cloud-taskqueue.consumer",
    TRACE_APPEND: "https://www.googleapis.com/auth/trace.append",
    TRACE_READONLY: "https://www.googleapis.com/auth/trace.readonly"
};

export class GoogleApi {

    @cached
    public get logging() {
        return new GoogleLogging(this.options);
    }
    @cached
    public get datastore() {
        return new GoogleDatastore(this.options);
    }
    @cached
    public get bigquery() {
        return new GoogleBigquery(this.options);
    }
    @cached
    public get pubsub() {
        return new GooglePubsub(this.options);
    }
    @cached
    public get tracing() {
        return new GoogleTracing(this.options);
    }

    async auth(){
        await this.logging.auth.authorize();
        await this.datastore.auth.authorize();
        await this.bigquery.auth.authorize();
        await this.pubsub.auth.authorize();
        await this.tracing.auth.authorize();
        return this;
    }

    constructor(readonly options: GoogleApiOptions={}) {
        Object.defineProperty(this, 'options', {
            value: options
        })
    }
}
