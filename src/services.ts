import {Config} from "./config";

export class Services {
    load(config:Config):Promise<Services>{
        return Promise.resolve(this);
    }
}
export default new Services()