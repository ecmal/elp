import {Command} from './command';
import {Option} from './command';
import {Cli} from "./command";
import {Project} from "../models/project";

@Command({
    title  : 'Install Package',
    args   : '<package,...>',
    usage  : [`
    Usage :
    |  elp install [options] alias=registry:project@version
    |
    Examples :
    |  elp install -s node=github:ecmal/node@4.5.0
    |  elp install npm:angular
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
        Project.read(this.cwd).install();
    }
}