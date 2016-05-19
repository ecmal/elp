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
    |  elp compile [options] [path]
    |
    Examples :
    |  elp compile
    |  elp compile ./my-module
    |  elp compile -o ./my/out/dir ./my-module/package.json
    `]
})
export class Bundle extends Cli {

    @Option({
        alias    : 'f',
        args     : 'file',
        title    : 'Output directory'
    })
    file:string;

    @Option({
        alias    : 'e',
        title    : 'Output directory'
    })
    executable:boolean;

    execute(path:string=this.cwd){
        Project.read(path).compile(false,this.file||'bundle.js',!!this.executable);
    }

}