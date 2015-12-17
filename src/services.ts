import Config from "./config";
import {FileSystem} from "./utils/fs";

export class Services {
    load(config:Config):Promise<Services>{
        return Promise.resolve(this);
    }
}
export default new Services()