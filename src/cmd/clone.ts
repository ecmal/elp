import {Command} from './command';
import {Cli} from "./command";
import {Library} from "../models/library";
import {Url} from "../models/url";
import FileSystem from "../utils/fs";

const process = system.node.process;

@Command({
    title  : 'Clone Package',
    args   : '<package,...>',
    usage  : [`
    Usage  :
    |  elp clone [options] [path]
    `]
})
export class Clone extends Cli {
    execute(url:string,path?:string){
        if(Url.isValid(url)){
            try {
                var show = Library.show(url);
                if(show){
                    var dir = FileSystem.resolve(process.cwd(),path||show.name);
                    var lib = Library.get(url);
                    if(!show.exist){
                        lib.install(true);
                    }
                    lib.workdir(dir,show.source.name,`${show.registry}/${show.source.name}`)
                }
            }catch(ex){
                console.info(ex.stack)
            }
        }
    }
}