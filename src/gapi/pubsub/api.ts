import { cached } from "@ecmal/runtime/decorators";
import { Buffer } from "@ecmal/node/buffer";
import { GoogleApiBase } from "../base";

export interface Topic {
    name: string;
    projectId: string,
    topicId: string
}
export interface Message {
    data: any,
    attributes?: Dictionary<string>,
    messageId?: string,
    ackId?: string,
    publishTime?: string,
}
export interface PushConfig {
    pushEndpoint: string;
    attributes: Dictionary<string>;
}
export interface Subscription {
    name?: string;
    topic?: string;
    pushConfig?: PushConfig;
    ackDeadlineSeconds?: number;
    subscriptionId?: string;
}

export class PubsubEntity {
    readonly name: string;
    readonly projectId: string;
    readonly api: GooglePubsub;
    constructor(api: GooglePubsub) {
        Object.defineProperty(this, 'api', {
            value: api
        })
    }
}
export class PubsubMessage implements Message {
    data: any;
    attributes: Dictionary<string>;
    messageId: string;
    ackId: string;
    publishTime: string;
    protected subscription: Subscription;
    constructor(subscription: PubsubSubscription, options: Message) {
        options.data = Buffer.from(String(options.data), 'base64');
        if(!options.attributes || !options.attributes['content-type'] || options.attributes['content-type']=='application/json'){
            try{
                options.data = JSON.parse(options.data.toString('utf8'))    
            }catch(ex){
                console.error(ex);
            }
        }
        Object.defineProperty(this, 'subscription', {
            value: subscription
        });
        Object.assign(this, options);
        Object.freeze(this);
    }
    accept() {

    }
    done() {

    }
}
export class PubsubSubscription extends PubsubEntity implements Subscription {
    readonly topic: string;
    readonly name: string;
    readonly pushConfig: PushConfig;
    readonly ackDeadlineSeconds: number;

    protected handler: (message: PubsubMessage) => Promise<any>
    protected timer: any;
    
    public subscriptionId:string;

    constructor(api: GooglePubsub, handler: (message: PubsubMessage) => Promise<any>, options: Subscription) {
        super(api);
        this.subscriptionId = options.name.split('/')[3]
        Object.assign(this,options);
        Object.defineProperty(this, 'handler', {
            value: handler
        });
        Object.freeze(this);
        this.poll().catch(ex => {
            console.info(ex);
        });
    }
    protected async poll() {
        let status = {};
        let commit = async (sec) => {
            let statuses = {
                complete: [],
                failed: []
            };
            for (var i in status) {
                let ackId = status[i];
                if (ackId == 'failed' || ackId == 'complete') {
                    statuses[ackId].push(i);
                    delete status[i];
                }
            }
            if (statuses.complete.length) {
                await this.api.resource.subscriptions.acknowledge(this.subscriptionId,{ 
                    ackIds: statuses.complete 
                })
            }
            if (statuses.failed.length) {
                await this.api.resource.subscriptions.modifyAckDeadline(this.subscriptionId,{ 
                    ackIds: statuses.failed,
                    ackDeadlineSeconds: 0
                })
            }
        };
        let wait = async (sec) => {
            return new Promise(accept => setTimeout(accept, sec))
        };
        let request = async () => {
            //console.info("POLL");
            let result = await this.api.resource.subscriptions.pull(this.subscriptionId,{
                maxMessages: 1,
                returnImmediately: false
            });
            if (result.receivedMessages) {
                let promises = result.receivedMessages.map(item => {
                    status[item.ackId] = 'pending';
                    try {
                        let message = new PubsubMessage(this, item.message);
                        return this.handler(message).then(
                            r => (status[item.ackId] = 'complete'),
                            e => (status[item.ackId] = 'failed')
                        )
                    } catch (ex) {
                        status[item.ackId] = 'failed'
                    }

                });
                await commit(await Promise.all(promises))
            }
        };
        while (true) {
            await request();
            await wait(1000);
        }
    }
}

export class PubsubTopic extends PubsubEntity implements Topic {
    readonly topicId: string;
    constructor(api: GooglePubsub, options: Topic) {
        super(api);
        Object.assign(this, options)
        Object.freeze(this);
    }
    async publish(messages: Message[]) {
        messages.forEach(m => {
            if (!m.attributes) {
                m.attributes = {};
            }
            if (!Buffer.isBuffer(m.data)) {
                if (typeof m.data == 'object') {
                    m.data = Buffer.from(JSON.stringify(m.data), 'utf8')
                    m.attributes['content-type'] = 'application/json'
                } else
                    if (typeof m.data == 'string') {
                        m.data = Buffer.from(JSON.stringify(m.data), 'utf8')
                        m.attributes['content-type'] = 'plain/text'
                    } else {
                        m.data = Buffer.from(JSON.stringify({}), 'utf8')
                        m.attributes['content-type'] = 'application/json'
                    }
            } else {
                m.attributes['content-type'] = 'application/json'
            }
            m.data = m.data.toString('base64');
        });
        return this.api.resource.topics.publish(this.topicId, messages)
    }
    public async subscribe(name: string, handler: (message: PubsubMessage) => Promise<any>, subscription?: Subscription) {
        subscription = Object.assign({ topic: this.name }, subscription);
        let result, params = {
            subscriptionId: name,
            projectId: this.projectId,
        };
        try {
            
            result = await this.api.resource.subscriptions.create(name,subscription);
        } catch (ex) {
            if (ex.code == 409) {
                result = await this.api.resource.subscriptions.get(name);
            } else {
                throw ex;
            }
        }
        return new PubsubSubscription(this.api, handler, result)
    }
}

export class GooglePubsub extends GoogleApiBase {
    @cached
    public get resource() {
        return {
            subscriptions: {
                create: async (subscriptionId: string, body: Subscription): Promise<any> => {
                    return await this.call({
                        method: 'PUT',
                        host: 'pubsub.googleapis.com',
                        path: `/v1/projects/${this.options.project}/subscriptions/${subscriptionId}`,
                        body: body
                    });
                },
                get: async (subscriptionId: string): Promise<any> => {
                    return await this.call({
                        method: 'GET',
                        host: 'pubsub.googleapis.com',
                        path: `/v1/projects/${this.options.project}/subscriptions/${subscriptionId}`
                    });
                },
                list: async (): Promise<any> => {
                    return await this.call({
                        method: 'GET',
                        host: 'pubsub.googleapis.com',
                        path: `/v1/projects/${this.options.project}/subscriptions`
                    });
                },
                pull: async (subscriptionId: string, body: { returnImmediately: boolean; maxMessages: number; }): Promise<any> => {
                    return await this.call({
                        method: 'POST',
                        host: 'pubsub.googleapis.com',
                        path: `/v1/projects/${this.options.project}/subscriptions/${subscriptionId}:pull`,
                        body: body
                    });
                },
                acknowledge: async (subscriptionId: string, body: {ackIds: string[]}): Promise<any> => {
                    return await this.call({
                        method: 'POST',
                        host: 'pubsub.googleapis.com',
                        path: `/v1/projects/${this.options.project}/subscriptions/${subscriptionId}:acknowledge`,
                        body: body
                    });
                },
                modifyPushConfig: async (subscriptionId: string, body: {pushConfig: PushConfig}): Promise<any> => {
                    return await this.call({
                        method: 'POST',
                        host: 'pubsub.googleapis.com',
                        path: `/v1/projects/${this.options.project}/topics/${subscriptionId}:modifyPushConfig`,
                        body: body
                    });
                },
                modifyAckDeadline: async (subscriptionId: string, body: {ackIds: string[];ackDeadlineSeconds: number;}): Promise<any> => {
                    return await this.call({
                        method: 'POST',
                        host: 'pubsub.googleapis.com',
                        path: `/v1/projects/${this.options.project}/subscriptions/${subscriptionId}:modifyAckDeadline`,
                        body: body
                    });
                },
                delete: async (subscriptionId: string): Promise<any> => {
                    return await this.call({
                        method: 'DELETE',
                        host: 'pubsub.googleapis.com',
                        path: `/v1/projects/${this.options.project}/subscriptions/${subscriptionId}`
                    });
                }
            },
            topics: {
                create: async (topicId: string): Promise<any> => {
                    return await this.call({
                        method: 'PUT',
                        host: 'pubsub.googleapis.com',
                        path: `/v1/projects/${this.options.project}/topics/${topicId}`
                    });
                },
                get:async (topicId: string): Promise<any> => {
                    return await this.call({
                        method: 'GET',
                        host: 'pubsub.googleapis.com',
                        path: `/v1/projects/${this.options.project}/topics/${topicId}`
                    });
                },
                list: async (): Promise<any> => {
                    return await this.call({
                        method: 'GET',
                        host: 'pubsub.googleapis.com',
                        path: `/v1/projects/${this.options.project}/topics`
                    });
                },
                publish: async (topicId: string, messages: Message[]): Promise<any> => {
                    return await this.call({
                        method: 'POST',
                        host: 'pubsub.googleapis.com',
                        path: `/v1/projects/${this.options.project}/topics/${topicId}:publish`,
                        body: {messages}
                    });
                },
                delete: async (topicId: string): Promise<any> => {
                    return await this.call({
                        method: 'DELETE',
                        host: 'pubsub.googleapis.com',
                        path: `/v1/projects/${this.options.project}/topics/${topicId}`
                    });
                },
                subscriptions: {
                    list: async (topicId: string): Promise<any> => {
                        return await this.call({
                            method: 'GET',
                            host: 'pubsub.googleapis.com',
                            path: `/v1/projects/${this.options.project}/topics/${topicId}/subscriptions`
                        });
                    }
                }
            }
        }
    }

    async createTopic(topicId:string) {
        let result;
        try {
            result = await this.resource.topics.create(topicId);
        } catch (ex) {
            if (ex.code == 409) {
                result = await this.resource.topics.get(topicId);
            } else {
                console.error(ex);
                throw ex;
            }
        }
        return new PubsubTopic(this, Object.assign(result, {topicId}));
    }

}

