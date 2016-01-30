import {Command} from './command';
import {Cli} from "./command";

import {FileSystem} from "../utils/fs";
import {GitIgnore} from "../utils/gitignore";

@Command({
    title  : 'Validate Package',
    args   : '<package,...>',
    usage  : [`
    Usage :
    |  espm validate [options]
    `]
})
export class Validate extends Cli {
    execute(path:string=this.cwd){
        var ignoreFile = FileSystem.resolve(path,'.gitignore');
        if(FileSystem.isFile(ignoreFile)){
            var gi = new GitIgnore(FileSystem.readFile(ignoreFile).toString());
            console.info(gi.denies('out'))
        }
    }
}