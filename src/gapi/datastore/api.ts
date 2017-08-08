import { GoogleApiBase, GoogleRequest } from "../base";
import { LookupBody, LookupResult } from "./types";
import { RunQueryBody,RunQueryResult } from "./types";
import { AllocateIdsBody, AllocateIdsResult } from "./types";
import { BeginTransactionResult } from "./types";
import { CommitBody, CommitResult } from "./types";
import { RollbackBody  } from "./types";

export class GoogleDatastore extends GoogleApiBase {
    public async allocateIds(options:AllocateIdsBody):Promise<AllocateIdsResult>{
        return await this.call({
            method  : 'POST',
            host    : 'datastore.googleapis.com',
            path    : `/v1/projects/${this.options.project}:allocateIds`,
            body    : options
        });
    }
    public async beginTransaction():Promise<BeginTransactionResult>{
        return await this.call({
            method  : 'POST',
            host    : 'datastore.googleapis.com',
            path    : `/v1/projects/${this.options.project}:beginTransaction`,
        });
    }
    public async commit(options:CommitBody):Promise<CommitResult>{
        console.info(options);
        return await this.call({
            method  : 'POST',
            host    : 'datastore.googleapis.com',
            path    : `/v1/projects/${this.options.project}:commit`,
            body    : options
        });
    }
    public async lookup(options:LookupBody):Promise<LookupResult>{
        return await this.call({
            method  : 'POST',
            host    : 'datastore.googleapis.com',
            path    : `/v1/projects/${this.options.project}:lookup`,
            body    : options
        });
    }
    public async rollback(options:RollbackBody):Promise<void>{
        return await this.call({
            method  : 'POST',
            host    : 'datastore.googleapis.com',
            path    : `/v1/projects/${this.options.project}:rollback`,
            body    : options
        });
    }
    public async runQuery(options:RunQueryBody):Promise<RunQueryResult>{
        return await this.call({
            method  : 'POST',
            host    : 'datastore.googleapis.com',
            path    : `/v1/projects/${this.options.project}:runQuery`,
            body    : options
        });
    }
    
}

