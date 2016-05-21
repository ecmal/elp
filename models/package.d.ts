export declare class Package {
    static read(path: string): any;
    private internal;
    private json;
    path: string;
    name: string;
    registry: string;
    vendor: any;
    version: any;
    directories: any;
    dirname: string;
    filename: string;
    sourceDir: string;
    outputDir: string;
    patch(props: any): this;
    constructor(path: any, json?: any);
    clone(): Package;
    read(path: any): void;
    toJSON(): any;
    write(path: any): void;
}
