export declare class Source {
    static isResource(ext: any): boolean;
    static getHash(content: any): any;
    static getName(path: any): any;
    static getExt(path: any): string;
    static getType(path: any): any;
    name: string;
    project: string;
    dirname: string;
    files: any;
    main: boolean;
    uri: string;
    ts: any;
    js: any;
    tsx: any;
    tsd: any;
    map: any;
    version: string;
    content: any;
    script: any;
    resources: any[];
    compilable: boolean;
    constructor(project: string, name: string, main?: boolean);
    cleanMap(): any;
    bundle(maps?: boolean): any;
    mapTo(dir: any): void;
    addFile(file: any): void;
    toString(full?: boolean): string;
    toMetadata(): {
        name: string;
        version: string;
        size: any;
        hash: any;
        files: {};
    };
    protected inspect(): string;
}
