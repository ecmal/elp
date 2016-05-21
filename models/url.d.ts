export declare class Url {
    static isValid(url: string): boolean;
    static stringify(url: any): string;
    static parse(url: string): Url;
    registry: string;
    vendor: string;
    project: string;
    version: string;
    url: string;
    constructor(url: string | any, parent?: Url);
    parse(url: string): boolean;
    stringify(): string;
    toString(): string;
}
