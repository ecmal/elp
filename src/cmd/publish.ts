import {Command} from './command';
import {Option} from './command';
import {Cli} from "./command";

import {FileSystem} from "../utils/fs";
import {Compiler} from "../compiler/compiler";
import {Package} from "../models/package";
import {Registry} from "../registry/registry";

@Command({
    title  : 'Install Package',
    args   : '<package,...>',
    usage  : [`
    Usage :
    |  espm publish [options] alias=registry:project@version
    |
    Examples :
    |  espm install -s node=github:ecmal/node@4.5.0
    |  espm install npm:angular
    `]
})
export class Publish extends Cli {

    private compiler:Compiler = new Compiler();

    execute(path:string=this.cwd){
        var pack = Package.read(path);
        if(this.output){
            pack.outputDir = this.output;
        }
        var packFile = this.compiler.compile(pack,true);
        Registry.get(pack.registry).publish(packFile);
        console.info(pack.vendor);
        console.info(pack.name);
        console.info(pack.version);

    }
}