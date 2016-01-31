import {Command} from './command';
import {Option} from './command';
import {Cli} from "./command";

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

    @Option({
        alias    : 't',
        title    : 'Include Tests'
    })
    tests:boolean=false;

    execute(path:string=this.cwd){
        var project:Project = Project.read(path);

        if(this.output){
            project.dirs.vendor = this.output;
        }

        if(this.watch){
            console.info(`Watching  "${project.name}" into "${project.vendorDir}"`);
            project.watch(this.tests);
        }else{
            console.info(`Compiling "${project.name}" into "${project.vendorDir}"`);
            project.compile(this.tests);
        }
    }

}