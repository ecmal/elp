export declare class FileSystem {
    private static fs;
    private static path;
    private static crypto;
    static resolve(...paths: string[]): string;
    static relative(base: string, path: string): string;
    static basename(path: string, ext?: string): string;
    static dirname(path: string): string;
    static extname(path: string): any;
    static exists(path: any): any;
    static stats(path: any): any;
    static isDir(path: any): any;
    static isFile(path: any): any;
    static cleanDir(path: any, filter?: (f: string) => boolean): void;
    static removeDir(path: any): void;
    static copyDir(fromDir: any, toDir: any): void;
    static readDir(dir: any, recursive?: boolean, includeDirs?: boolean): any[];
    static watchDir(path: any, cb: (e: string, f: string) => void, recursive?: boolean): any;
    static createDir(path: any, recursive?: boolean): void;
    static removeFile(path: any): void;
    static copyFile(fromPath: any, toPath: any): void;
    static chmodFile(path: string, mode: string): void;
    static writeFile(path: string, data: any): any;
    static writeJson(path: string, data: any): any;
    static readFile(path: string): any;
    static readFileHash(path: string): string;
    static readJson(path: string): any;
}
export default FileSystem;
