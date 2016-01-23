import {Command} from './command';
import {Option} from './command';
import {Cli} from "./command";

import {FileSystem} from "../utils/fs";
import {Compiler} from "../compiler/compiler";
import {Package} from "../models/package";
import {Registry} from "../registry/registry";
import {Repository} from "../utils/git";

@Command({
    title  : 'Status Package',
    args   : '<package,...>',
    usage  : [`
    Usage :
    |  espm status [options] alias=registry:project@version
    `]
})
export class Status extends Cli {
    execute(path:string=this.cwd){
        var pack = Package.read(path);
        var repo = new Repository(pack.dirname);
        console.info(repo.status());
        console.info(repo.remotes());
        console.info(repo.log());
    }
}

