import {Command} from './command';
import {Cli} from "./command";


@Command({
    title  : 'Clone Package',
    args   : '<package,...>',
    usage  : [`
    Usage  :
    |  elp clone [options] [path]
    `]
})
export class Remotes extends Cli {
    execute(){

    }
}