import {Command} from './command';
import {Option} from './command';
import {Cli} from "./command";
import config from "../config";

import {Client as Github} from 'github/client';

@Command({
    title  : 'Temporary Test',
    usage  : [`
    Usage :
    |  espm test suite method [args...]
    `]
})
export class Test extends Cli {
    private get github():GithubService{
        return new GithubService();
    };
    execute(...args){
        if(args.length<2){
          Test.help();
        } else {
            var s=args.shift(),m=args.shift();
            var suite = this[s];
            if (suite) {
                var method = suite[m];
                if (typeof method == 'function') {
                    suite[m](...args)
                } else {
                    console.error(`no such method "${m}" in suite "${s}"`)
                }
            } else {
                console.error(`no such suite "${s}"`);
            }
        }
    }
}

class GithubService {
    private api:Github;
    constructor(){
        this.api = new Github(
            config.settings.username,
            config.settings.password
        );
    }
    static bold(str:string){
        return `\033[1m${str}\033[0m`
    }
    static pad(str:string,cnt:number,ch:string=' '){
        while(str.length<cnt){
            str+=ch;
        }
        return str;
    }
    static printObject(data:any,headline?:any){
        var keys = Object.keys(headline||data);
        var head = ['Property','Value'];
        var size = [head[0].length,head[1].length];
        var body = [];
        for(var i=0;i<keys.length;i++){
            var key = keys[i];
            var title = (headline[key]||key);
            var value = (data[key]);
            size[0] = Math.max(size[0],String(title).length);
            size[1] = Math.max(size[1],String(value).length);
            body.push([title,value]);
        }
        console.info(body.map((r)=>{
            return '  '+[
                GithubService.bold(GithubService.pad(String(r[0]),size[0])),
                GithubService.pad(String(r[1]),size[1])
            ].join(' - ');
        }).join('\n'));

    }
    static printTable(data:any[],headline?:any){
        var keys = [];
        var head = [];
        var size = [];
        var body = [];

        for(var key in headline){
            keys.push(key);
            head.push(headline[key]);
            size.push(headline[key].length);
        }
        for(var i=0;i<data.length;i++){
            var row = [],item=data[i];
            for(var k=0,key=keys[k];k<keys.length;key=keys[++k]){
                row.push(String(item[key]));
                size[k] = Math.max(size[k],String(item[key]).length);
            }
            body.push(row);
        }
        console.info('  '+head.map((s,i)=>GithubService.bold(GithubService.pad(s,size[i]))).join(' | '));
        console.info(body.map((r)=>{
            return '  '+r.map((r,i)=>GithubService.pad(r,Math.min(size[i],64))).join(' | ');
        }).join('\n'));

    }

    user(){
        this.api.user().then(r=>{
            GithubService.printObject(r,{
                id      : 'Id',
                login   : 'Login',
                name    : 'Name',
                email   : 'Email',
                url     : 'Url'
            });
        }).catch(e=>console.info(e.stack))
    }

    orgs(name){
        if(name){
            this.api.orgs(name).then((r:any)=>{
                console.info(GithubService.bold("Organization"));
                GithubService.printObject(r,{
                    login   : 'Name',
                    url     : 'Url'
                });
                return this.api.get(r.repos_url).then(r=>{
                    console.info(GithubService.bold("Repositories"));
                    GithubService.printTable(r.map((r:any)=>({
                        name    : r.name,
                        owner   : r.owner.login,
                        fork    : r.fork,
                        private : r.private,
                        canPush : r.permissions.push,
                        canPull : r.permissions.pull,
                        url     : r.url,
                    })),{
                        name    : "Name",
                        owner   : "Owner",
                        fork    : "Is Fork",
                        private : "Is Private",
                        canPush : "Can Push",
                        canPull : "Can Pull",
                        url     : "Url"
                    });
                })
            })
        }else{
            this.api.userOrgs().then(r=>{
                GithubService.printTable(r,{
                    login   : 'Name',
                    url     : 'Url'
                });
            })
        }
    }


    search(query){
        this.api.searchRepo(query).then(r=>{
            GithubService.printTable(<any>r.items,{
                name            : 'Name',
                full_name       : 'Url',
                description     : 'Description'
            });
        });
    }

    show(what){
        if(what.match(/^[a-z0-9_\-\.]+$/i)){
            this.api.users(what).then(r=>console.info(r))
        }else{
            this.api.repos(what).then((r:any)=>{
                var repo = {
                    name    : r.name,
                    owner   : r.owner.login,
                    fork    : r.fork,
                    private : r.private,
                    canPush : r.permissions.push,
                    canPull : r.permissions.pull,
                    url     : r.url,
                };
                console.info(GithubService.bold("Project"));
                GithubService.printObject(repo,{
                    name    : "Name",
                    owner   : "Owner",
                    fork    : "Is Fork",
                    private : "Is Private",
                    canPush : "Can Push",
                    canPull : "Can Pull",
                    url     : "Url"
                });
                return this.api.get(r.url+'/releases').then(r=>{
                    console.info(GithubService.bold("Releases"));
                    GithubService.printTable(r.splice(0,5).map((r:any)=>({
                        version : r.tag_name,
                        author  : r.author.login,
                        name    : r.name
                    })),{
                        version : "Version",
                        author  : "Author",
                        name    : "Name"
                    });
                })
            })
        }
    }
}

