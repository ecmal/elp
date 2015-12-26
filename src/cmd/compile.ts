import {Command} from './command';
import {Option} from './command';
import {Cli} from "./command";
import {FileSystem} from "../utils/fs";
import {Compiler} from "../compiler/compiler";
import {Package} from "../models/package";

@Command({
    title  : 'Compile Project',
    args   : '[path]',
    usage  : [`
    Usage :
    |  espm compile [options] [path]
    |
    Examples :
    |  espm compile
    |  espm compile ./my-module
    |  espm compile -o ./my/out/dir ./my-module/package.json
    `]
})
export class Compile extends Cli {

    @Option({
        alias    : 'w',
        title    : 'Watch files for compilation'
    })
    watch:boolean=false;

    @Option({
        alias    : 'o',
        args     : 'dir',
        title    : 'Output directory'
    })
    output:boolean=false;

    private compiler:Compiler = new Compiler();

    execute(path:string=this.cwd){
        let pack;
        path = FileSystem.resolve(path);
        if(!FileSystem.exists(path)){
            console.error(`Invalid project path "${path}"`);
        }
        if(FileSystem.isDir(path)){
            path = FileSystem.resolve(path,'package.json');
        }
        if(FileSystem.isFile(path)){
            pack = new Package(path);
        }

        if(this.output){
            pack.outputDir = this.output;
        }

        if(this.watch){
            this.compiler.watch(pack);
        }else{
            this.compiler.compile(pack);
        }
    }
}