import { Url } from "./url";
import { Registry } from "./registry";
import { Repository } from "../utils/git";
export declare class Library {
    static home: string;
    static local(url: Url): string;
    static clear(): void;
    static list(): any[];
    static get(url: any): Library;
    static show(url: any): {
        name: string;
        vendor: string;
        remote: any;
        local: string;
        exist: any;
        registry: any;
        source: {
            name: any;
            sha: any;
        };
        release: {
            name: string;
            sha: any;
        };
        versions: {
            version: string;
            sha: any;
        }[];
        refs: any;
    };
    static install(url: any): void;
    constructor(url: any);
    url: Url;
    registry: Registry;
    local: string;
    remote: any;
    installed: any;
    versions: {};
    git: Repository;
    toString(): string;
    inspect(): string;
    info(): void;
    install(dev?: boolean): void;
    fetch(): void;
    extract(dir: string): void;
    workdir(path: any, branch?: any, remote?: any): void;
    remove(): void;
    files(version: any): {};
    cached(): void;
}
