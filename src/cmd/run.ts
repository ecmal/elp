import {Command} from './command';
import {Option} from './command';
import {Cli} from "./command";

import {Project} from "../models/project";
import {FileSystem} from "../utils/fs";

const process = system.node.process;
const CP = system.node.require('child_process');

const RUN_SCRIPT = `
require('./runtime/package');
system.import('§MAIN§').catch(function(e){
    console.error(e.stack);
    process.exit(1);
});
`;


@Command({
    title  : 'Run Project',
    args   : '[path]',
    usage  : [`
    Usage :
    |  elp compile [options] [path]
    |
    Examples :
    |  elp compile
    |  elp compile ./my-module
    |  elp compile -o ./my/out/dir ./my-module/package.json
    `]
})
export class Run extends Cli {
    static get SM():any{
        if(typeof this['SourceMap']=='undefined'){
            try {
                this['SourceMap'] = system.node.require('source-map');
            }catch(e){
                this['SourceMap'] = false;
            }
        }
        return this['SourceMap'];
    }

    @Option({
        alias    : 'w',
        title    : 'Watch files for compilation'
    })
    watch:boolean=false;

    @Option({
        alias    : 't',
        args     : '<module>',
        title    : 'Watch files for compilation'
    })
    test:boolean=false;

    private project:Project;
    private maps:any={};

    private mapFor(path:string,line:number,column:number){
        var mapJson:any = this.maps[path];
        if(!mapJson){
            var mapPath = FileSystem.resolve(this.project.vendorDir,path+'.js.map');
            if(FileSystem.isFile(mapPath)){
                mapJson = this.maps[path] = Run.SM.SourceMapConsumer(
                    JSON.parse(FileSystem.readFile(mapPath))
                );
                var pos:any = mapJson.originalPositionFor({line,column});
                return `${pos.source}:${pos.line}:${pos.column}`;
            }
        }
        return `${path}:${line}:${column}`;

    }

    private get regexp():RegExp{
        if(!this['rx']){
            var basePath = this.project.vendorDir.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            this['rx'] = new RegExp(basePath+'\/([A-Z0-9\\/\\-_\\.]*)\.js:(\\d+):(\\d+)','i');
        }
        return this['rx'];
    }
    format(l){
        if(Run.SM){
            var match = l.match(this.regexp);
            if(match){
                return l.replace(match[0],this.mapFor(match[1],parseInt(match[2]),parseInt(match[3])))
            }
        }
        return l;
    }
    execute(...args){

        var project:Project = this.project = Project.read(this.cwd);
        var runFile = FileSystem.resolve(project.vendorDir,`${project.name}.js`);
        FileSystem.writeFile(runFile,RUN_SCRIPT.trim().replace('§MAIN§',this.test?`${project.name}/${this.test}`:project.main));
        var child = CP.fork(runFile,args,<any>{
            cwd     : project.vendorDir,
            silent  : true
        });
        var outFirst = true;
        var errFirst = true;
        child.stderr.on('data',(data)=>{
            process.stderr.write(data.toString().split(/\n/).map((l,i)=>{
                if(errFirst || i>0){
                    errFirst = false;
                    return `err | ${this.format(l)}`;
                }else{
                    return this.format(l);
                }
            }).join('\n'));
        });
        child.stdout.on('data', (data)=>{
            process.stdout.write(data.toString().split(/\n/).map((l,i)=>{
                if(outFirst || i>0){
                    outFirst = false;
                    return `out | ${this.format(l)}`;
                }else{
                    return this.format(l);
                }
            }).join('\n'));
        });
        child.on('close', (...args)=>{
            console.info('close',...args)
        });
    }

}
