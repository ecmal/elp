import {Command} from './command';
import {Option} from './command';
import {Cli} from "./command";
import {Library} from "../models/library";
import {Url} from "../models/url";
import {Registry} from "../models/registry";


@Command({
    title  : 'Fetch Package',
    args   : '<package,...>',
    usage  : [`
    Usage :
    |  elp fetch [options] alias=registry:project@version
    `]
})
export class Fetch extends Cli {
    private url:Url;
    execute(url:string){
        if(Url.isValid(url)){
            Library.get(url).install();
        }
    }
}