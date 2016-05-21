import { Url } from "./url";
export declare class Registry {
    static for(url: any): Registry;
    static all(): Registry[];
    static get(url: string | Url): Registry;
    static add(type: any): void;
    id: any;
    options: any;
    remote(url: any): any;
    matches(url: any): boolean;
    local(url: any): string;
    toString(): string;
    inspect(): string;
}
export declare class GitRegistry extends Registry {
}
export declare class BitbucketRegistry extends GitRegistry {
}
export declare class GithubRegistry extends GitRegistry {
}
