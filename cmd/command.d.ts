export declare function Option(settings?: any): any;
export declare function Command(settings?: any): any;
export declare class Cli {
    static title: string;
    static version: string;
    static help(): string;
    help: boolean;
    version: boolean;
    protected cwd: string;
    execute(...args: any[]): void;
}
declare var _default: (name: any, version: any) => void;
export default _default;
