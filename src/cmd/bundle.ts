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
export class Bundle extends Cli {

    @Option({
        alias    : 'o',
        args     : 'dir',
        title    : 'Output directory'
    })
    output:boolean=false;

    execute(path:string=this.cwd){
        Project.read(path).compile(false,true,true);
    }

}