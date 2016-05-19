import {Command} from './command';
import {Option} from './command';
import {Cli} from "./command";

import {FileSystem} from "../utils/fs";
import {Compiler} from "../compiler/compiler";
import {Package} from "../models/package";
import {Registry} from "../models/registry";
import {Repository} from "../utils/git";

@Command({
    title  : 'Status Package',
    args   : '<package,...>',
    usage  : [`
    Usage :
    |  elp status [options] alias=registry:project@version
    `]
})
export class Status extends Cli {
    execute(path:string=this.cwd){
        var pack = Package.read(path);
        var repo = new Repository(pack.dirname);
        //var regs = Registry.all();
        //var status  = repo.status();
        //var remotes = repo.remotes();
        var refs = repo.refs();
        console.info(refs)
        /*var log = repo.log();
        var regs = Object.keys(remotes).map(k=>{
            for(var r of regs){
                if(r.matches(remotes[k].url)){
                    remotes[k].registry = r.id;
                    return r;
                }
            }
        });
        console.info(regs);
        console.info(refs);
        console.info(status);
        console.info(remotes);
        console.info(log);*/
    }
}

