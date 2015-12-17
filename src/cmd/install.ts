import {Command} from './command';
import {Option} from './command';
import {Cli} from "./command";

@Command({
    title  : 'Install Package',
    args   : '<package,...>',
    usage  : [`
    Usage :
    |  espm install [options] alias=registry:project@version
    |
    Examples :
    |  espm install -s node=github:ecmal/node@4.5.0
    |  espm install npm:angular
    `]
})
export class Install extends Cli {

    @Option({
        alias    : 's',
        title    : 'Save to package config ?'
    })
    save:boolean;

    @Option({
        alias    : 'd',
        title    : 'Save to package config ?'
    })
    saveDev:boolean;

    execute(...packages){
        console.info(packages);
    }
}