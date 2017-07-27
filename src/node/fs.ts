import { BufferLike, Encoding } from "./buffer";

export interface ReadFileOptions {
    encoding?: string;
    flag?: string;
}

export interface WriteFileOptions extends ReadFileOptions {
    mode?: string;
}

export interface WatchFileOptions {
    persistent?: boolean; 
    interval?: number; 
}

export interface Stats {
    isFile(): boolean;
    isDirectory(): boolean;
    isBlockDevice(): boolean;
    isCharacterDevice(): boolean;
    isSymbolicLink(): boolean;
    isFIFO(): boolean;
    isSocket(): boolean;
    dev: number;
    ino: number;
    mode: number;
    nlink: number;
    uid: number;
    gid: number;
    rdev: number;
    size: number;
    blksize: number;
    blocks: number;
    atime: Date;
    mtime: Date;
    ctime: Date;
    birthtime: Date;
}

export class FileSystem {
    private fs = require('fs');
    private pt = require('path');
    private ps = require('process');
    public getCurrentDir(): string {
        return this.ps.cwd();
    }
    public dirname(path:string):string{
        return this.pt.dirname(path);
    }
    public resolve(base:string,...paths:string[]):string{
        return this.pt.resolve(base,...paths);
    }
    public statSync(path:string):Stats{
        return this.fs.statSync(path);
    }
    public existsSync(path: string):boolean{
        return this.fs.existsSync(path);
    }
    public readDirSync(dirname: string): string[] {
        return this.fs.readdirSync(dirname);
    }
    public readDirsSync(path:string){
        var results = [];
        var walk = (dir)=>{
            var list = this.readDirSync(dir)
            list.forEach((file)=>{
                file = dir + '/' + file
                var stat = this.statSync(file)
                if (stat && stat.isDirectory()){
                    results = results.concat(walk(file))
                } else {
                    results.push(file)
                }
            })
            return results
        }
        return walk(path);
    }
    public readFileSync(filename: string, options?: ReadFileOptions|Encoding): BufferLike {
        return this.fs.readFileSync(filename, options);
    }
    public writeFileSync(filename: string, data: BufferLike, options?: WriteFileOptions|Encoding) {
        return this.fs.writeFileSync(filename, data, options);
    }
    public watchFile(filename: string, options: WatchFileOptions, listener: (curr: Stats, prev: Stats) => void): void{
        return this.fs.watchFile(filename,options,listener);
    }
}

export const fs = new FileSystem();
export default fs;
