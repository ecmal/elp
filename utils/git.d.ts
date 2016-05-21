export declare abstract class Entity {
    repo: Repository;
    constructor(repo: Repository);
    abstract parse(data: string): any;
}
export declare class Remote extends Entity {
    refs: {
        [key: string]: string;
    };
    branches: string[];
    tags: string[];
    hasTag(name: any): boolean;
    hasBranch(name: any): boolean;
    inspect(): {
        refs: {
            [key: string]: string;
        };
        branches: string[];
        tags: string[];
    };
    parse(data: string): Remote;
}
export declare class Status {
    local: any;
    remote: any;
    ahead: number;
    changes: any;
    initial: boolean;
    clear: boolean;
    constructor(status: any);
}
export interface Remote {
    name: string;
}
export interface Remotes {
    [k: string]: Remote;
}
export declare class Repository {
    static refs(url: string): any;
    static clear(dir: any): void;
    private static parseRefs(text);
    static isGitDir(path: any): boolean;
    path: string;
    base: string;
    exec(...args: any[]): {
        status: boolean;
        command: string;
        output: string;
    };
    hook(name: any, content: any): void;
    head(ref: string): void;
    config(): any;
    getRemote(remote: string, pattern?: string): Remote;
    hasRemote(name: any): boolean;
    addRemote(name: any, url: any, ...options: any[]): void;
    constructor(path: string);
    initialized: boolean;
    clear(): void;
    init(): boolean;
    fetch(remote: any, branch?: any): string;
    remote(name: any): string;
    remotes(): Remotes;
    status(): Status;
    rev(name: any): string;
    refs(remote?: any): any;
    readDir(branch?: string, base?: any): {};
    readFile(branch: any, path?: any): string;
    log(obj?: string, count?: number): any;
    tag(name: any, ref?: any): any;
    push(remote: any, ref: any, tags?: boolean): any;
    toString(): string;
    protected inspect(): string;
}
