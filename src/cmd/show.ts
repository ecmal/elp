import {Command} from './command';
import {Option} from './command';
import {Cli} from "./command";
import {Library} from "../models/library";
import {Url} from "../models/url";
import {Registry} from "../models/registry";


@Command({
    title  : 'Show Package',
    args   : '<package,...>',
    usage  : [`
    Usage :
    |  espm show [options] alias=registry:project@version
    `]
})
export class Show extends Cli {
    private url:Url;
    execute(url:string){
        if(Url.isValid(url)){
            console.info(Library.show(url));
        }
    }
}