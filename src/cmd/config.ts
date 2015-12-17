import {Command} from './command';
import {Option} from './command';
import {Cli} from "./command";

@Command({
    title  : 'Initialize Package',
    usage  : [`
    Usage :
    |  espm init [options]
    |
    Examples :
    |  espm init -n my-app
    `]
})
export class Init extends Cli {

    @Option({
        alias    : 'n',
        args     : 'name',
        title    : 'Save to package config ?'
    })
    name:string;

    execute(...packages){
        console.info(this.name,packages);
    }
}