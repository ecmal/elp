export declare class GitIgnore {
    include: RegExp[];
    exclude: RegExp[];
    constructor(content: any);
    accepts(input: string): boolean;
    denies(input: string): boolean;
    maybe(input: string): boolean;
}
