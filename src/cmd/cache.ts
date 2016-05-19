import {Command} from './command';
import {Option} from './command';
import {Cli} from "./command";
import {Library} from "../models/library";
import {Url} from "../models/url";
import {Registry} from "../models/registry";


@Command({
    title  : 'Cached Management',
    args   : '[package]',
    usage  : [`
    Usage :
    |  elp cache -i registry:project@version
    |  elp cache -r registry:project@version
    |  elp cache -l
    |  elp cache -c
    `]
})
export class Cache extends Cli {

    @Option({
        alias    : 'l',
        title    : 'List packages'
    })
    private list:boolean;

    @Option({
        alias    : 'c',
        title    : 'List packages'
    })
    private clear:boolean;

    @Option({
        alias    : 'i',
        args     : '<package>',
        title    : 'List packages'
    })
    private install:string;

    @Option({
        alias    : 'r',
        args     : '<package>',
        title    : 'List packages'
    })
    private remove:string;



    execute(){
        if(this.install){
            if(Url.isValid(this.install)){
                Library.get(this.install).install();
            }
        } else
        if(this.remove){
            if(Url.isValid(this.remove)){
                Library.get(this.remove).remove();
            }
        } else
        if(this.clear){
            Library.clear();
        } else {
            Library.list().forEach(l=>{
                console.info(l.toString())
            });
        }
    }

}