import {Command} from './command';
import {Option} from './command';
import {Cli} from "./command";

import {FileSystem} from "../utils/fs";
import {Compiler} from "../compiler/compiler";
import {Project} from "../models/project";

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

    execute(path:string=this.cwd){
        if(this.watch){
            Project.read(path).watch();
        }else{
            Project.read(path).compile();
        }
    }

}